import { useState } from "react";
import { Link } from "react-router-dom";
import { authorName, coverTone, money } from "../lib/format";
import type { Book } from "../types";

export function BookCard({ book, onRemove }: { book: Book; onRemove?: () => void }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.coverImage) && !failed;
  const price = money(book.price);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition hover:-translate-y-0.5">
      <Link to={`/books/${book.id}`} className="block">
        <div
          className="flex aspect-[3/4] items-center justify-center overflow-hidden"
          style={{ background: coverTone(book.title) }}
        >
          {showImage ? (
            <img
              src={book.coverImage ?? undefined}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              onError={() => setFailed(true)}
            />
          ) : (
            <span className="font-serif text-5xl text-ink/70">{book.title.slice(0, 1)}</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {book.category ? (
          <Link to={`/categories/${book.category.slug}`} className="text-xs font-semibold uppercase tracking-wider text-pine">
            {book.category.name}
          </Link>
        ) : null}
        <Link to={`/books/${book.id}`} className="font-serif text-lg leading-snug text-ink line-clamp-2">
          {book.title}
        </Link>
        {book.author?.id ? (
          <Link to={`/authors/${book.author.id}`} className="text-sm text-mute hover:text-ink">
            {authorName(book)}
          </Link>
        ) : (
          <p className="text-sm text-mute">{authorName(book)}</p>
        )}
        {onRemove ? (
          <button type="button" onClick={onRemove} className="text-left text-sm font-semibold text-clay">
            Remove
          </button>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3 text-sm">
          <span className="text-mute">
            {book.totalReviews ? `${book.averageRating?.toFixed(1)} · ${book.totalReviews}` : "No reviews"}
          </span>
          <span className="text-right">
            <span className="block font-semibold text-ink">{price ?? "Free"}</span>
            {typeof book.stockQuantity === "number" ? (
              <span className="block text-xs text-mute">
                {book.stockQuantity > 0 ? `${book.stockQuantity} in stock` : "Out of stock"}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {books.map((book, index) => (
        <div key={book.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}>
          <BookCard book={book} />
        </div>
      ))}
    </div>
  );
}
