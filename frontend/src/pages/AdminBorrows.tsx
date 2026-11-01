import { useState } from "react";
import { Link } from "react-router-dom";
import CommonSelect from "../components/CommonSelect";
import { Badge, Banner, Button, PageHeader } from "../components/ui";
import { useAdminBorrowsQuery, useUpdateBorrowStatusMutation } from "../features/api";
import { NEXT_BORROW, apiError, day, label, statusTone } from "../lib/format";
import type { BorrowStatus } from "../types";

const filters: Array<BorrowStatus | ""> = ["", "REQUESTED", "APPROVED", "BORROWED", "OVERDUE", "RETURNED", "CANCELLED"];

export function AdminBorrows() {
  const [status, setStatus] = useState<BorrowStatus | "">("");
  const [error, setError] = useState("");
  const records = useAdminBorrowsQuery(status || undefined);
  const [updateStatus] = useUpdateBorrowStatusMutation();

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="Loan desk"
        text="Approving a request does not change stock. Stock drops when you mark the copy borrowed, and returns when it comes back."
      />
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      <CommonSelect
        className="mb-4 max-w-xs"
        aria-label="Loan status"
        value={status}
        placeholder="All loans"
        item={filters.map((item) => ({ value: item, label: item ? label(item) : "All loans" }))}
        onValueChange={setStatus}
      />
      {records.isError ? <Banner>{apiError(records.error)}</Banner> : null}
      <div className="space-y-3">
        {records.data?.length === 0 ? <p className="text-sm text-mute">No loans in this view.</p> : null}
        {records.data?.map((record) => (
          <article key={record.id} className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link to={`/books/${record.book?.id}`} className="font-serif text-xl">{record.book?.title}</Link>
                <p className="text-sm text-mute">{record.user?.name} · {record.user?.email}</p>
                <p className="mt-1 text-sm text-mute">
                  Due {day(record.dueDate)}
                  {record.returnRequestedAt ? ` · Return requested ${day(record.returnRequestedAt)}` : ""}
                  {typeof record.book?.stockQuantity === "number" ? ` · ${record.book.stockQuantity} in stock` : ""}
                </p>
              </div>
              <Badge className={statusTone(record.status)}>{label(record.status)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {NEXT_BORROW[record.status].map((next) => (
                <Button
                  key={next}
                  tone={next === "CANCELLED" ? "danger" : "ghost"}
                  onClick={async () => {
                    setError("");
                    try {
                      await updateStatus({ id: record.id, status: next }).unwrap();
                    } catch (caught) {
                      setError(apiError(caught));
                    }
                  }}
                >
                  Mark {label(next)}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
