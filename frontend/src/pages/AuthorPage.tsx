import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAppSelector } from "../app/store";
import { BookGrid } from "../components/BookCard";
import { Empty, PageHeader, PageLoader } from "../components/ui";
import { useMyAuthorQuery, usePublicAuthorQuery } from "../features/api";
import { apiError } from "../lib/format";
import type { AuthorProfile } from "../types";

export function AuthorPage() {
  const { id = "" } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const insideDashboard = user?.role === "ADMIN" || user?.role === "AUTHOR";
  const mine = useMyAuthorQuery(undefined, { skip: !insideDashboard });
  const author = usePublicAuthorQuery(id, { skip: !id });

  useEffect(() => {
    if (author.data) document.title = `${author.data.penName || author.data.user?.name || "Author"} · Folio`;
  }, [author.data]);

  const ownPage = insideDashboard && (id === user?.id || id === mine.data?.id);
  if (ownPage) {
    return <Navigate to={user?.role === "ADMIN" ? "/admin/author" : "/studio/author"} replace />;
  }

  if (author.isLoading) return <PageLoader />;
  if (author.isError || !author.data) return <Empty title="Author not found" text={apiError(author.error)} />;

  return <AuthorView profile={author.data} />;
}

export function DashboardAuthorPage() {
  const user = useAppSelector((state) => state.auth.user);
  const author = usePublicAuthorQuery(user?.id ?? "", { skip: !user });

  useEffect(() => {
    if (author.data) document.title = `${author.data.penName || author.data.user?.name || "Author"} · Folio`;
  }, [author.data]);

  if (author.isLoading) return <PageLoader />;
  if (author.isError || !author.data) {
    const profilePath = user?.role === "ADMIN" ? "/admin/profile" : "/studio/profile";
    return (
      <Empty
        title="No author page yet"
        text="Save a pen name on your profile and this page will show your published books."
        action={<Link to={profilePath} className="text-sm font-semibold text-pine">Open profile</Link>}
      />
    );
  }

  return <AuthorView profile={author.data} />;
}

function AuthorView({ profile }: { profile: AuthorProfile }) {
  const name = profile.penName || profile.user?.name || "Author";
  const links = profile.socialLinks ? Object.entries(profile.socialLinks) : [];

  return (
    <div>
      <PageHeader kicker="Author" title={name} text={profile.bio || "Published work from this author."} />
      <div className="mb-8 flex flex-wrap gap-4 text-sm">
        {profile.website ? (
          <a className="font-semibold text-pine" href={profile.website} target="_blank" rel="noreferrer">
            Website
          </a>
        ) : null}
        {links.map(([key, value]) => (
          <a key={key} className="font-semibold text-pine" href={value} target="_blank" rel="noreferrer">
            {key}
          </a>
        ))}
      </div>
      {profile.books && profile.books.length > 0 ? (
        <BookGrid books={profile.books} />
      ) : (
        <Empty title="No published books yet" />
      )}
    </div>
  );
}
