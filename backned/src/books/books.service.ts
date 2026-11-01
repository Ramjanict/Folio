import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto, BookSortOrder } from './dto/book-query.dto';
import { BookStatus, Role, Prisma } from '@prisma/client';

function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
}

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateAuthorProfile(userId: string) {
    let authorProfile = await this.prisma.authorProfile.findUnique({
      where: { userId },
    });

    if (!authorProfile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      authorProfile = await this.prisma.authorProfile.create({
        data: {
          userId,
          penName: user.name,
        },
      });
    }

    return authorProfile;
  }

  async create(userId: string, userRole: Role, dto: CreateBookDto) {
    const authorProfile = await this.getOrCreateAuthorProfile(userId);

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Specified category does not exist');
    }

    if (dto.isbn) {
      const existingIsbn = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existingIsbn) {
        throw new BadRequestException('Book with this ISBN already exists');
      }
    }

    const slug = slugify(dto.title);

    // Authors can save a draft or submit it. Only an admin can publish or archive.
    let initialStatus = dto.status || BookStatus.DRAFT;
    if (userRole !== Role.ADMIN) {
      if (initialStatus === BookStatus.PUBLISHED) {
        initialStatus = BookStatus.PENDING_REVIEW;
      } else if (initialStatus === BookStatus.ARCHIVED) {
        throw new ForbiddenException('Only administrators can archive books');
      }
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        slug,
        isbn: dto.isbn || null,
        description: dto.description || null,
        coverImage: dto.coverImage || null,
        pageCount: dto.pageCount || null,
        publishedYear: dto.publishedYear || null,
        language: dto.language || 'English',
        price: dto.price !== undefined ? dto.price : 0,
        stockQuantity: dto.stockQuantity !== undefined ? dto.stockQuantity : 1,
        status: initialStatus,
        authorId: authorProfile.id,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
        author: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  }

  async findAllPublic(query: BookQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {
      status: BookStatus.PUBLISHED,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { isbn: { contains: searchTerm, mode: 'insensitive' } },
        {
          author: {
            penName: { contains: searchTerm, mode: 'insensitive' },
          },
        },
      ];
    }

    let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === BookSortOrder.OLDEST) {
      orderBy = { createdAt: 'asc' };
    } else if (query.sort === BookSortOrder.PRICE_ASC) {
      orderBy = { price: 'asc' };
    } else if (query.sort === BookSortOrder.PRICE_DESC) {
      orderBy = { price: 'desc' };
    } else if (query.sort === BookSortOrder.TITLE_ASC) {
      orderBy = { title: 'asc' };
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: {
            select: {
              id: true,
              penName: true,
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    const booksWithRating = books.map((book) => {
      const totalRatings = book.reviews.length;
      const avgRating =
        totalRatings > 0
          ? Number(
              (
                book.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                totalRatings
              ).toFixed(1),
            )
          : 0;

      const { reviews, ...rest } = book;
      return {
        ...rest,
        averageRating: avgRating,
        totalReviews: totalRatings,
      };
    });

    return {
      data: booksWithRating,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    idOrSlug: string,
    viewer?: { id: string; role: Role } | null,
  ) {
    const book = await this.prisma.book.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        author: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            borrowRecords: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const canSeeUnpublished =
      viewer?.role === Role.ADMIN || book.author.userId === viewer?.id;

    if (book.status !== BookStatus.PUBLISHED && !canSeeUnpublished) {
      throw new NotFoundException('Book not found');
    }

    const allRatings = await this.prisma.review.findMany({
      where: { bookId: book.id },
      select: { rating: true },
    });

    const avgRating =
      allRatings.length > 0
        ? Number(
            (
              allRatings.reduce((acc, curr) => acc + curr.rating, 0) /
              allRatings.length
            ).toFixed(1),
          )
        : 0;

    return {
      ...book,
      averageRating: avgRating,
    };
  }

  async findAuthorBooks(userId: string, query: BookQueryDto) {
    const authorProfile = await this.prisma.authorProfile.findUnique({
      where: { userId },
    });

    if (!authorProfile) {
      return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {
      authorId: authorProfile.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          _count: {
            select: { reviews: true, borrowRecords: true },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllAdmin(query: BookQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 15));
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { isbn: { contains: term, mode: 'insensitive' } },
        { author: { penName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          author: {
            select: {
              penName: true,
              user: { select: { name: true, email: true } },
            },
          },
          _count: {
            select: { reviews: true, borrowRecords: true },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    bookId: string,
    userId: string,
    userRole: Role,
    dto: UpdateBookDto,
  ) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Permission check: only author owner or admin
    if (userRole !== Role.ADMIN && book.author.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this book',
      );
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat) throw new BadRequestException('Invalid category ID');
    }

    if (dto.isbn && dto.isbn !== book.isbn) {
      const existingIsbn = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existingIsbn) {
        throw new BadRequestException('Book with this ISBN already exists');
      }
    }

    const data: Prisma.BookUpdateInput = {
      title: dto.title,
      description: dto.description,
      isbn: dto.isbn,
      coverImage: dto.coverImage,
      pageCount: dto.pageCount,
      publishedYear: dto.publishedYear,
      language: dto.language,
      price: dto.price !== undefined ? dto.price : undefined,
      stockQuantity:
        dto.stockQuantity !== undefined ? dto.stockQuantity : undefined,
    };

    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }

    // Status changes
    if (dto.status) {
      if (userRole === Role.ADMIN) {
        data.status = dto.status;
      } else {
        // Author can switch between DRAFT and PENDING_REVIEW
        if (
          dto.status === BookStatus.DRAFT ||
          dto.status === BookStatus.PENDING_REVIEW
        ) {
          data.status = dto.status;
        } else {
          throw new ForbiddenException(
            'Only administrators can approve and publish books',
          );
        }
      }
    }

    return this.prisma.book.update({
      where: { id: bookId },
      data,
      include: {
        category: true,
        author: {
          select: { penName: true },
        },
      },
    });
  }

  async updateStatus(bookId: string, status: BookStatus) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

    return this.prisma.book.update({
      where: { id: bookId },
      data: { status },
      include: { category: true, author: true },
    });
  }

  async remove(bookId: string, userId: string, userRole: Role) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true },
    });

    if (!book) throw new NotFoundException('Book not found');

    if (userRole !== Role.ADMIN && book.author.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this book',
      );
    }

    await this.prisma.book.delete({ where: { id: bookId } });
    return { message: 'Book deleted successfully' };
  }
}
