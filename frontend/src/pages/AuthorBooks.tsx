import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Banner, Button, Empty, PageHeader, Pager, Panel } from "../components/ui";
import { useMyBooksQuery } from "../features/api";
import { apiError, day, label, statusTone } from "../lib/format";

export function AuthorBooks() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const [page, setPage] = useState(1);
  const books = useMyBooksQuery({ search: query || undefined, page, limit: 12 });

  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div>
      <PageHeader
        kicker="Studio"
        title="Your manuscripts"
        text="Drafts stay private. Submit a book for review when it is ready. Only an admin can publish it."
        action={
          <Link to="/studio/books/new">
            <Button>New book</Button>
          </Link>
        }
      />
      {query ? <p className="mb-4 text-sm text-mute">Results for “{query}”</p> : null}
      {books.isError ? <Banner>{apiError(books.error)}</Banner> : null}
      {books.data && books.data.data.length === 0 ? (
        <Empty
          title={query ? "No manuscripts match that search" : "No manuscripts yet"}
          action={
            <Link to="/studio/books/new" className="text-sm font-semibold text-pine">
              Write the first one
            </Link>
          }
        />
      ) : null}
      <div className="space-y-3">
        {books.data?.data.map((book) => (
          <Panel key={book.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link to={`/books/${book.id}`} className="font-serif text-xl">
                {book.title}
              </Link>
              <p className="text-sm text-mute">
                Updated {day(book.updatedAt)} · {book.category?.name || "Uncategorized"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusTone(book.status)}>{label(book.status || "DRAFT")}</Badge>
              <Link to={`/studio/books/${book.id}/edit`} className="text-sm font-semibold text-pine">
                Edit
              </Link>
            </div>
          </Panel>
        ))}
      </div>
      <Pager page={books.data?.meta.page ?? page} total={books.data?.meta.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}
