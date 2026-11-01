import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { BookGrid } from "../components/BookCard";
import CommonSelect from "../components/CommonSelect";
import { PriceRange } from "../components/PriceRange";
import { ScrollRow } from "../components/ScrollRow";
import { ShelfRow } from "../components/ShelfRow";
import { Banner, Empty, Pager, Skeleton } from "../components/ui";
import { useBooksQuery, useCategoriesQuery } from "../features/api";
import { apiError, coverTone } from "../lib/format";
import type { BookQuery, Category } from "../types";

const PRICE_FLOOR = 0;
const PRICE_CEILING = 50;

const sorts: { value: NonNullable<BookQuery["sort"]>; label: string }[] = [
  { value: "latest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Title" },
  { value: "price_asc", label: "Low to high" },
  { value: "price_desc", label: "High to low" },
];

const welcome = [
  {
    title: "Borrow a copy",
    text: "Request a loan when the book is in stock. An admin confirms the copy goes out.",
  },
  {
    title: "Keep a shelf",
    text: "Save titles you want to come back to. Your list stays with your account.",
  },
  {
    title: "Authors submit",
    text: "Writers file a draft. An admin publishes it, and it joins the shelf.",
  },
];

const rowNames = ["Fantasy", "Mystery & Thriller", "Classics", "Science"];

export function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const categoryId = params.get("category") ?? "";
  const sort = (params.get("sort") as BookQuery["sort"]) || "latest";
  const page = Number(params.get("page") || 1);
  const minPrice = clampPrice(params.get("min"), PRICE_FLOOR);
  const maxPrice = Math.max(minPrice, clampPrice(params.get("max"), PRICE_CEILING));
  const [slide, setSlide] = useState(0);
  const categories = useCategoriesQuery();
  const newest = useBooksQuery({ sort: "latest", page: 1, limit: 16 });
  const books = useBooksQuery({
    search: q || undefined,
    categoryId: categoryId || undefined,
    sort,
    page,
    limit: 12,
    minPrice: minPrice > PRICE_FLOOR ? minPrice : undefined,
    maxPrice: maxPrice < PRICE_CEILING ? maxPrice : undefined,
  });

  const priceActive = minPrice > PRICE_FLOOR || maxPrice < PRICE_CEILING;
  const browsing = !q && !categoryId && !priceActive && page <= 1 && (sort === "latest" || !params.get("sort"));

  useEffect(() => {
    document.title = q ? `“${q}” · Folio` : "Folio";
  }, [q]);

  function update(patch: Record<string, string | null>, keepPage = false) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!keepPage) next.delete("page");
    setParams(next);
  }

  const featured = (categories.data ?? [])
    .filter((category) => rowNames.includes(category.name))
    .sort((a, b) => rowNames.indexOf(a.name) - rowNames.indexOf(b.name));

  return (
    <div>
      <section className="border-b border-[#ece7df] pb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-2xl text-ink sm:text-3xl">Welcome to Folio</h1>
          <div className="flex gap-1">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink transition hover:bg-paper"
              aria-label="Previous"
              onClick={() => setSlide((current) => (current + welcome.length - 1) % welcome.length)}
            >
              <LuChevronLeft />
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink transition hover:bg-paper"
              aria-label="Next"
              onClick={() => setSlide((current) => (current + 1) % welcome.length)}
            >
              <LuChevronRight />
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {welcome.map((item, index) => (
            <article
              key={item.title}
              className={`rounded border border-[#e4ddd2] bg-[#faf8f4] p-4 transition ${index === slide ? "ring-2 ring-pine/30" : ""}`}
            >
              <h2 className="font-serif text-lg">{item.title}</h2>
              <p className="mt-1 text-sm leading-6 text-mute">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-[#ece7df] py-5">
        <h2 className="mb-3 font-serif text-xl">Browse the stacks</h2>
        <ScrollRow count={categories.data?.length ?? 0}>
          {(categories.data ?? []).map((category) => (
            <Stack key={category.id} category={category} />
          ))}
        </ScrollRow>
        {categories.isError ? <p className="mt-2 text-sm text-mute">Categories could not be loaded.</p> : null}
      </section>

      <section className="border-b border-[#ece7df] py-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-xl">Find a price</h2>
          <CommonSelect
            className="w-40"
            aria-label="Sort"
            value={sort}
            item={sorts}
            onValueChange={(value) => update({ sort: value })}
          />
        </div>
        <PriceRange
          min={minPrice}
          max={maxPrice}
          floor={PRICE_FLOOR}
          ceiling={PRICE_CEILING}
          sort={sort}
          onPrice={(low, high) =>
            update({
              min: low <= PRICE_FLOOR ? null : String(low),
              max: high >= PRICE_CEILING ? null : String(high),
            })
          }
          onSort={(next) => update({ sort: next })}
        />
        {priceActive || q || categoryId ? (
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-pine"
            onClick={() => update({ min: null, max: null, q: null, category: null, sort: null })}
          >
            Clear filters
          </button>
        ) : null}
      </section>

      {books.isError ? (
        <div className="py-4">
          <Banner>{apiError(books.error)}</Banner>
        </div>
      ) : null}

      {browsing ? (
        <section className="mt-2 rounded border border-[#e4ddd2] px-3 sm:px-4">
          <div className="flex items-baseline justify-between py-3">
            <h2 className="font-serif text-2xl">Featured</h2>
            <p className="text-sm text-mute">{books.data?.meta.total ?? "—"} published titles</p>
          </div>
          {newest.isLoading ? <RowSkeleton /> : null}
          {newest.data ? <ShelfRow title="New on the shelf" books={newest.data.data} /> : null}
          {featured.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </section>
      ) : (
        <section className="py-5">
          <h2 className="font-serif text-2xl">{q ? `Results for “${q}”` : "Results"}</h2>
          {books.isLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4]" />
              ))}
            </div>
          ) : books.data && books.data.data.length > 0 ? (
            <>
              <p className="mb-4 mt-2 text-sm text-mute">
                {books.data.meta.total} published {books.data.meta.total === 1 ? "title" : "titles"}
                {priceActive ? ` from $${minPrice} to $${maxPrice}` : ""}
              </p>
              <BookGrid books={books.data.data} />
              <Pager
                page={books.data.meta.page}
                total={books.data.meta.totalPages}
                onPage={(next) => update({ page: String(next) }, true)}
              />
            </>
          ) : (
            <div className="mt-4">
              <Empty title="No titles match those filters" text="Try a wider price range, or clear the search." />
            </div>
          )}
        </section>
      )}

      <section className="mt-8 grid gap-6 border-t border-[#ece7df] py-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl">A shelf kept by the people who use it</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-mute">
            Readers borrow copies, authors submit new books, and admins decide what gets published.
          </p>
          <Link
            to="/register"
            className="mt-4 inline-flex rounded bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-pine-dark"
          >
            Create an account
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <Stat name="Titles" value={books.data?.meta.total} />
          <Stat name="Categories" value={categories.data?.length} />
        </dl>
      </section>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const books = useBooksQuery({ categoryId: category.id, sort: "latest", limit: 16, page: 1 });
  if (books.isLoading) return <RowSkeleton />;
  if (!books.data || books.data.data.length === 0) return null;
  return <ShelfRow title={category.name} seeAll={`/categories/${category.slug}`} books={books.data.data} />;
}

function Stack({ category }: { category: Category }) {
  const [failed, setFailed] = useState(false);
  const sample = useBooksQuery({ categoryId: category.id, limit: 1, page: 1 });
  const cover = sample.data?.data[0]?.coverImage;
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group w-[5.4rem] shrink-0 rounded-xl border border-transparent px-1.5 py-2 text-center transition duration-200 hover:-translate-y-1 hover:border-[#c9d7ea] hover:bg-[#f3f7fb] hover:shadow-md"
    >
      <span
        className="mx-auto block h-[4.6rem] w-12 overflow-hidden rounded shadow-sm transition duration-200 group-hover:scale-105"
        style={{ background: coverTone(category.name) }}
      >
        {cover && !failed ? (
          <img src={cover} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <span className="grid h-full place-items-center font-serif text-lg text-ink/70">{category.name.slice(0, 1)}</span>
        )}
      </span>
      <span className="mt-2 block truncate text-xs text-ink">{category.name}</span>
    </Link>
  );
}

function Stat({ name, value }: { name: string; value?: number }) {
  return (
    <div className="rounded border border-[#e4ddd2] bg-[#faf8f4] p-4">
      <dt className="text-xs uppercase tracking-wider text-mute">{name}</dt>
      <dd className="mt-1 font-serif text-3xl">{value ?? "—"}</dd>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex gap-4 border-t border-[#ece7df] py-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-[7.25rem] shrink-0" />
      ))}
    </div>
  );
}

function clampPrice(value: string | null, fallback: number) {
  if (!value) return fallback;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, amount));
}
