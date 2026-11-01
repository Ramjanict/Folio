import { useState } from "react";
import { Link } from "react-router-dom";
import { coverTone } from "../lib/format";
import type { Book } from "../types";
import { ScrollRow } from "./ScrollRow";

export function ShelfRow({
  title,
  seeAll,
  books,
}: {
  title: string;
  seeAll?: string;
  books: Book[];
}) {
  if (books.length === 0) return null;

  return (
    <section className="border-t border-[#ece7df] py-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl text-ink">{title}</h3>
        {seeAll ? (
          <Link to={seeAll} className="shrink-0 text-sm text-pine hover:underline">
            See all
          </Link>
        ) : null}
      </div>
      <ScrollRow count={books.length} arrows="cover">
        {books.map((book) => (
          <Cover key={book.id} book={book} />
        ))}
      </ScrollRow>
    </section>
  );
}

function Cover({ book }: { book: Book }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.coverImage) && !failed;

  return (
    <div className="w-[7.25rem] shrink-0">
      <Link to={`/books/${book.id}`} className="block">
        <div className="aspect-[2/3] overflow-hidden shadow-sm" style={{ background: coverTone(book.title) }}>
          {showImage ? (
            <img
              src={book.coverImage ?? undefined}
              alt=""
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
              onError={() => setFailed(true)}
            />
          ) : (
            <span className="grid h-full place-items-center font-serif text-3xl text-ink/70">{book.title.slice(0, 1)}</span>
          )}
        </div>
      </Link>
      <Link
        to={`/books/${book.id}`}
        className="mt-2 block rounded bg-pine px-2 py-1 text-center text-xs font-semibold text-white transition hover:bg-pine-dark"
      >
        Borrow
      </Link>
    </div>
  );
}
