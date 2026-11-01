import { useState } from "react";
import { Link } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { Banner, Empty, PageHeader, PageLoader } from "../components/ui";
import { useFavoritesQuery, useToggleFavoriteMutation } from "../features/api";
import { apiError } from "../lib/format";

export function Favorites() {
  const favorites = useFavoritesQuery();
  const [toggle] = useToggleFavoriteMutation();
  const [error, setError] = useState("");

  return (
    <div>
      <PageHeader kicker="Saved" title="Books you marked" text="A private shelf. Removing a book calls the same toggle the catalog uses." />
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      {favorites.isLoading ? <PageLoader /> : null}
      {favorites.isError ? <Banner>{apiError(favorites.error)}</Banner> : null}
      {favorites.data && favorites.data.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {favorites.data.map((item, index) => (
            <div key={item.favoriteId} className="animate-rise" style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}>
            <BookCard
              book={item.book}
              onRemove={async () => {
                try {
                  await toggle(item.book.id).unwrap();
                } catch (caught) {
                  setError(apiError(caught));
                }
              }}
            />
            </div>
          ))}
        </div>
      ) : favorites.data ? (
        <Empty
          title="Nothing saved yet"
          text="Open a book in the catalog and save it."
          action={<Link to="/" className="text-sm font-semibold text-pine">Browse the catalog</Link>}
        />
      ) : null}
    </div>
  );
}
