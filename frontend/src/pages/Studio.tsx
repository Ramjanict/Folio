import { Link } from "react-router-dom";
import { StatusChart } from "../components/charts";
import { Badge, Banner, Button, Empty, PageHeader, PageLoader, Panel } from "../components/ui";
import { useMyBooksQuery } from "../features/api";
import { apiError, countBy, day, label, statusTone } from "../lib/format";

export function Studio() {
  const books = useMyBooksQuery({ limit: 100 });
  const rows = books.data?.data ?? [];
  const counts = countBy(rows.map((book) => book.status || "DRAFT"));

  return (
    <div>
      <PageHeader
        kicker="Studio"
        title="Your desk"
        text="Drafts stay private. Submit a book for review when it is ready. Only an admin can publish it."
        action={<Link to="/studio/books/new"><Button>New book</Button></Link>}
      />
      {books.isError ? <Banner>{apiError(books.error)}</Banner> : null}
      {books.isLoading ? <PageLoader /> : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Drafts" value={rows.filter((book) => book.status === "DRAFT").length} />
        <Stat label="In review" value={rows.filter((book) => book.status === "PENDING_REVIEW").length} />
        <Stat label="Published" value={rows.filter((book) => book.status === "PUBLISHED").length} />
      </div>
      <StatusChart title="Books by status" text="Counts from your latest 100 manuscripts." data={counts} />
      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">Recent manuscripts</h2>
        <Link to="/studio/books" className="text-sm font-semibold text-pine">See all</Link>
      </div>
      <div className="mt-3 space-y-3">
        {rows.length === 0 && !books.isLoading ? <Empty title="No manuscripts yet" action={<Link to="/studio/books/new" className="text-sm font-semibold text-pine">Write the first one</Link>} /> : null}
        {rows.slice(0, 5).map((book) => (
          <Panel key={book.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link to={`/books/${book.id}`} className="font-serif text-xl">{book.title}</Link>
              <p className="text-sm text-mute">Updated {day(book.updatedAt)} · {book.category?.name || "Uncategorized"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusTone(book.status)}>{label(book.status || "DRAFT")}</Badge>
              <Link to={`/studio/books/${book.id}/edit`} className="text-sm font-semibold text-pine">Edit</Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Stat({ label: name, value }: { label: string; value: number }) {
  return (
    <Panel>
      <p className="text-sm text-mute">{name}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </Panel>
  );
}
