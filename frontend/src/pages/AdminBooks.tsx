import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CommonSelect from "../components/CommonSelect";
import { Badge, Banner, Button, PageHeader, Pager, TextInput } from "../components/ui";
import { useAdminBooksQuery, useDeleteBookMutation, useUpdateBookStatusMutation } from "../features/api";
import { apiError, label, statusTone } from "../lib/format";
import type { BookStatus } from "../types";

const statuses: BookStatus[] = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"];

export function AdminBooks() {
  const [params] = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [search, setSearch] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [status, setStatus] = useState<BookStatus | "">("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const books = useAdminBooksQuery({ search: query || undefined, status: status || undefined, page, limit: 12 });
  const [updateStatus] = useUpdateBookStatusMutation();
  const [remove] = useDeleteBookMutation();

  useEffect(() => {
    setSearch(urlQuery);
    setQuery(urlQuery);
    setPage(1);
  }, [urlQuery]);

  return (
    <div>
      <PageHeader kicker="Admin" title="Every manuscript" text="Approve a submission by publishing it, or archive a title that should leave the catalog." />
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      <form
        className="mb-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, ISBN, or pen name" aria-label="Search books" />
        <CommonSelect
          className="sm:w-52"
          aria-label="Status"
          value={status}
          placeholder="All statuses"
          item={[{ value: "", label: "All statuses" }, ...statuses.map((item) => ({ value: item, label: label(item) }))]}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <Button type="submit">Search</Button>
      </form>
      {books.isError ? <Banner>{apiError(books.error)}</Banner> : null}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.data?.data.map((book) => (
              <tr key={book.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link to={`/books/${book.id}`} className="font-medium hover:text-pine">{book.title}</Link>
                  <p className="text-xs text-mute">{book._count?.reviews ?? 0} reviews · {book._count?.borrowRecords ?? 0} loans</p>
                </td>
                <td className="px-4 py-3 text-mute">{book.author?.penName || book.author?.user?.name || "—"}</td>
                <td className="px-4 py-3"><Badge className={statusTone(book.status)}>{label(book.status || "DRAFT")}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <CommonSelect
                      className="w-40"
                      aria-label={`Status for ${book.title}`}
                      value={book.status}
                      item={statuses.map((item) => ({ value: item, label: label(item) }))}
                      onValueChange={async (value) => {
                        setError("");
                        try {
                          await updateStatus({ id: book.id, status: value }).unwrap();
                        } catch (caught) {
                          setError(apiError(caught));
                        }
                      }}
                    />
                    <Button
                      tone="danger"
                      onClick={async () => {
                        if (!window.confirm(`Delete “${book.title}”?`)) return;
                        setError("");
                        try {
                          await remove(book.id).unwrap();
                        } catch (caught) {
                          setError(apiError(caught));
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={books.data?.meta.page ?? page} total={books.data?.meta.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}
