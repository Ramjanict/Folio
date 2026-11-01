import { useState } from "react";
import CommonSelect from "../components/CommonSelect";
import { Badge, Banner, PageHeader, Pager, Panel, TextInput } from "../components/ui";
import { useUpdateUserRoleMutation, useUpdateUserStatusMutation, useUserQuery, useUsersQuery } from "../features/api";
import { apiError, day, label, statusTone } from "../lib/format";
import type { Role, UserStatus } from "../types";

const roles: Role[] = ["USER", "AUTHOR", "ADMIN"];
const statuses: UserStatus[] = ["ACTIVE", "BLOCKED", "PENDING"];

export function AdminUsers() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const users = useUsersQuery({ search: query || undefined, role: role || undefined, status: status || undefined, page, limit: 12 });
  const detail = useUserQuery(selected ?? "", { skip: !selected });
  const [updateRole] = useUpdateUserRoleMutation();
  const [updateStatus] = useUpdateUserStatusMutation();

  async function change(action: Promise<unknown>) {
    setError("");
    try {
      await action;
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  return (
    <div>
      <PageHeader kicker="Admin" title="People" text="Block an account to revoke its sessions. Promoting a reader to author creates their author profile." />
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      <form
        className="mb-4 flex flex-col gap-3 lg:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" aria-label="Search people" />
        <CommonSelect
          className="lg:w-40"
          aria-label="Role"
          value={role}
          placeholder="All roles"
          item={[{ value: "", label: "All roles" }, ...roles.map((item) => ({ value: item, label: label(item) }))]}
          onValueChange={(value) => {
            setRole(value);
            setPage(1);
          }}
        />
        <CommonSelect
          className="lg:w-40"
          aria-label="Status"
          value={status}
          placeholder="All statuses"
          item={[{ value: "", label: "All statuses" }, ...statuses.map((item) => ({ value: item, label: label(item) }))]}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <button className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white" type="submit">Search</button>
      </form>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-mute">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.data.map((person) => (
                <tr key={person.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <button className="text-left font-medium hover:text-pine" onClick={() => setSelected(person.id)}>
                      {person.name}
                    </button>
                    <p className="text-xs text-mute">{person.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <CommonSelect
                      className="w-32"
                      aria-label={`Role for ${person.name}`}
                      value={person.role}
                      item={roles.map((item) => ({ value: item, label: label(item) }))}
                      onValueChange={(value) => change(updateRole({ id: person.id, role: value }).unwrap())}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <CommonSelect
                      className="w-32"
                      aria-label={`Status for ${person.name}`}
                      value={person.status}
                      item={statuses.map((item) => ({ value: item, label: label(item) }))}
                      onValueChange={(value) => change(updateStatus({ id: person.id, status: value }).unwrap())}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel>
          <h2 className="font-serif text-xl">Record</h2>
          {!selected ? <p className="mt-3 text-sm text-mute">Select a person to load their full record.</p> : null}
          {detail.isError ? <p className="mt-3 text-sm text-clay">{apiError(detail.error)}</p> : null}
          {detail.data ? (
            <dl className="mt-3 space-y-2 text-sm">
              <Row name="Joined" value={day(detail.data.createdAt)} />
              <Row name="Reviews" value={String(detail.data._count?.reviews ?? 0)} />
              <Row name="Loans" value={String(detail.data._count?.borrowRecords ?? 0)} />
              <Row name="Saved" value={String(detail.data._count?.favorites ?? 0)} />
              <Row name="Pen name" value={detail.data.authorProfile?.penName || "—"} />
              <div className="pt-2"><Badge className={statusTone(detail.data.status)}>{label(detail.data.status)}</Badge></div>
            </dl>
          ) : null}
        </Panel>
      </div>
      <Pager page={users.data?.meta.page ?? page} total={users.data?.meta.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-mute">{name}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
