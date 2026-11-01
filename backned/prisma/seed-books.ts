import { BookStatus, PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const TOTAL = 1000;
const AUTHOR_EMAIL_DOMAIN = 'authors.ramjan.library';

const categories = [
  { name: 'Fantasy', subjects: ['fantasy'], description: 'Quests, magic, and invented worlds.' },
  { name: 'Science Fiction', subjects: ['science_fiction'], description: 'Futures, space, and speculative ideas.' },
  { name: 'Mystery & Thriller', subjects: ['mystery_and_detective_stories'], description: 'Detectives, crimes, and suspense.' },
  { name: 'Romance', subjects: ['romance'], description: 'Love stories, old and new.' },
  { name: 'Horror', subjects: ['horror'], description: 'Ghosts, monsters, and dread.' },
  { name: 'Historical Fiction', subjects: ['historical_fiction'], description: 'Novels set in real periods of the past.' },
  { name: 'Classics', subjects: ['classic_literature'], description: 'Literature that has stayed in print for generations.' },
  { name: "Children's", subjects: ['juvenile_literature'], description: 'Picture books and stories for young readers.' },
  { name: 'Young Adult', subjects: ['young_adult_fiction'], description: 'Coming-of-age fiction for teen readers.' },
  { name: 'Biography', subjects: ['biography'], description: 'Lives of real people, told by themselves or others.' },
  { name: 'History', subjects: ['world_history', 'ancient_history'], description: 'Accounts of places, events, and public memory.' },
  { name: 'Science', subjects: ['popular_science'], description: 'Explainers and research writing on the natural world.' },
  { name: 'Philosophy', subjects: ['philosophy'], description: 'Ethics, logic, and big questions.' },
  { name: 'Poetry', subjects: ['poetry'], description: 'Collections and long poems.' },
  { name: 'Business', subjects: ['entrepreneurship', 'management'], description: 'Management, money, and work.' },
  { name: 'Psychology', subjects: ['psychology'], description: 'How people think, feel, and behave.' },
  { name: 'Self-Help', subjects: ['self-help'], description: 'Habits, wellbeing, and personal growth.' },
  { name: 'Cooking', subjects: ['cooking'], description: 'Recipes and food writing.' },
  { name: 'Art', subjects: ['art'], description: 'Painting, design, and art history.' },
  { name: 'Travel', subjects: ['travel'], description: 'Journeys and guides to places near and far.' },
];

interface OpenLibraryWork {
  key: string;
  title: string;
  cover_id?: number | null;
  first_publish_year?: number | null;
  edition_count?: number;
  authors?: { name: string; key: string }[];
}

const NOT_A_BOOK_TITLE =
  /\[|\breport\b|\bsession\b|\bproceedings\b|\bjournal\b|\bannual\b|\bbulletin\b|\bhearing\b|\bcongress\b|^advances in\b|^progress in\b|^international review\b|^annual reviews?\b/i;
const CORPORATE_AUTHOR =
  /\b(staff|company|committee|congress|united states|department|council|trust|association|institute|society|inc\.?|corporation|publishing|press|rand mcnally|anonymous|unknown)\b/i;

function looksLikeEnglishBook(work: OpenLibraryWork, authorName: string) {
  const title = work.title.trim();
  if (!/^[\x20-\x7E\u2018\u2019\u201C\u201D\u2013\u2014]+$/.test(title)) return false;
  if (NOT_A_BOOK_TITLE.test(title) || CORPORATE_AUTHOR.test(authorName)) return false;
  return (work.edition_count ?? 0) >= 2;
}

interface SeedBook {
  workKey: string;
  title: string;
  authorName: string;
  coverId: number;
  publishedYear: number | null;
  categorySlug: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchJson<T>(url: string, attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'FolioSeed/1.0 (book catalog demo)' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function fetchSubject(subject: string, limit: number) {
  const works: OpenLibraryWork[] = [];
  for (let offset = 0; offset < limit; offset += 100) {
    const data = await fetchJson<{ works: OpenLibraryWork[] }>(
      `https://openlibrary.org/subjects/${subject}.json?limit=100&offset=${offset}`,
    );
    works.push(...data.works);
    if (data.works.length < 100) break;
  }
  return works;
}

async function collectBooks() {
  const perCategory = Math.ceil(TOTAL / categories.length);
  const seen = new Set<string>();
  const picked: SeedBook[] = [];
  const spare: SeedBook[] = [];

  for (const category of categories) {
    const slug = slugify(category.name);
    const works: OpenLibraryWork[] = [];
    for (const subject of category.subjects) {
      works.push(...(await fetchSubject(subject, 500)));
    }
    let taken = 0;

    for (const work of works) {
      const authorName = work.authors?.[0]?.name?.trim();
      if (!work.cover_id || !authorName || !work.title?.trim() || seen.has(work.key)) continue;
      if (!looksLikeEnglishBook(work, authorName)) continue;
      seen.add(work.key);

      const book: SeedBook = {
        workKey: work.key,
        title: work.title.trim(),
        authorName,
        coverId: work.cover_id,
        publishedYear: work.first_publish_year ?? null,
        categorySlug: slug,
      };

      if (taken < perCategory) {
        picked.push(book);
        taken++;
      } else {
        spare.push(book);
      }
    }

    console.log(`${category.name}: ${taken} books`);
  }

  for (const book of spare) {
    if (picked.length >= TOTAL) break;
    picked.push(book);
  }

  return picked.slice(0, TOTAL);
}

async function main() {
  const books = await collectBooks();
  if (books.length < TOTAL) {
    throw new Error(`Open Library returned only ${books.length} usable books`);
  }

  console.log('Removing books, categories, reviews, favorites, and loans...');
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.borrowRecord.deleteMany(),
    prisma.book.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  await prisma.category.createMany({
    data: categories.map((category) => ({
      name: category.name,
      slug: slugify(category.name),
      description: category.description,
    })),
  });
  const categoryIds = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );

  const authorNames = [...new Set(books.map((book) => book.authorName))];
  const authorEmail = (name: string) => `${slugify(name) || 'author'}@${AUTHOR_EMAIL_DOMAIN}`;
  const unusablePassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

  await prisma.user.createMany({
    data: authorNames.map((name) => ({
      email: authorEmail(name),
      name,
      password: unusablePassword,
      role: Role.AUTHOR,
      status: UserStatus.ACTIVE,
    })),
    skipDuplicates: true,
  });

  const authorUsers = await prisma.user.findMany({
    where: { email: { endsWith: `@${AUTHOR_EMAIL_DOMAIN}` } },
    select: { id: true, name: true, email: true },
  });
  const userIdByEmail = new Map(authorUsers.map((user) => [user.email, user.id]));

  await prisma.authorProfile.createMany({
    data: authorUsers.map((user) => ({ userId: user.id, penName: user.name })),
    skipDuplicates: true,
  });
  const profileIdByUserId = new Map(
    (
      await prisma.authorProfile.findMany({
        where: { userId: { in: authorUsers.map((user) => user.id) } },
        select: { id: true, userId: true },
      })
    ).map((profile) => [profile.userId, profile.id]),
  );

  const usedSlugs = new Set<string>();
  const rows = books.map((book) => {
    const workId = book.workKey.split('/').pop()!.toLowerCase();
    let slug = `${slugify(book.title) || 'book'}-${workId}`;
    while (usedSlugs.has(slug)) slug = `${slug}-${randomInt(10, 99)}`;
    usedSlugs.add(slug);

    const userId = userIdByEmail.get(authorEmail(book.authorName))!;
    return {
      title: book.title.slice(0, 250),
      slug,
      description: book.publishedYear
        ? `${book.title} by ${book.authorName}, first published in ${book.publishedYear}.`
        : `${book.title} by ${book.authorName}.`,
      coverImage: `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`,
      publishedYear: book.publishedYear,
      language: 'English',
      price: randomInt(600, 3500) / 100,
      stockQuantity: randomInt(1, 8),
      status: BookStatus.PUBLISHED,
      authorId: profileIdByUserId.get(userId)!,
      categoryId: categoryIds.get(book.categorySlug)!,
    };
  });

  for (let index = 0; index < rows.length; index += 200) {
    await prisma.book.createMany({ data: rows.slice(index, index + 200) });
  }

  await prisma.user.deleteMany({
    where: {
      email: { endsWith: `@${AUTHOR_EMAIL_DOMAIN}` },
      authorProfile: { books: { none: {} } },
    },
  });

  console.log(
    `Created ${rows.length} books in ${categories.length} categories by ${authorNames.length} authors.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
