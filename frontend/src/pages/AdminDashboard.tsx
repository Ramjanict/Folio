import { StatusChart } from "../components/charts";
import { PageHeader, PageLoader, Panel } from "../components/ui";
import { useAdminBooksQuery, useAdminBorrowsQuery, useHealthQuery, useUsersQuery } from "../features/api";
import { countBy } from "../lib/format";

export function AdminDashboard() {
  const books = useAdminBooksQuery({ limit: 100 });
  const borrows = useAdminBorrowsQuery();
  const users = useUsersQuery({ limit: 100 });
  const health = useHealthQuery();
  const loading = books.isLoading || borrows.isLoading || users.isLoading;

  const bookRows = books.data?.data ?? [];
  const borrowRows = borrows.data ?? [];
  const userRows = users.data?.data ?? [];
  const openLoans = borrowRows.filter((row) => ["REQUESTED", "APPROVED", "BORROWED", "OVERDUE"].includes(row.status)).length;

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="Control room"
        text="Moderation, membership, and the loan desk. Charts use the latest 100 records when a list is longer."
      />
      {loading ? <PageLoader /> : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat name="People" value={users.data?.meta.total ?? userRows.length} />
        <Stat name="Books" value={books.data?.meta.total ?? bookRows.length} />
        <Stat name="Open loans" value={openLoans} />
        <Panel>
          <p className="text-sm text-mute">Database</p>
          <p className="mt-1 font-serif text-3xl">{health.data?.database === "up" ? "Up" : health.isError ? "Down" : "…"}</p>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusChart title="Books by status" kind="pie" data={countBy(bookRows.map((book) => book.status || "DRAFT"))} />
        <StatusChart title="Loans by status" data={countBy(borrowRows.map((row) => row.status))} />
        <StatusChart title="People by role" data={countBy(userRows.map((person) => person.role))} />
      </div>
    </div>
  );
}

function Stat({ name, value }: { name: string; value: number }) {
  return (
    <Panel>
      <p className="text-sm text-mute">{name}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </Panel>
  );
}
