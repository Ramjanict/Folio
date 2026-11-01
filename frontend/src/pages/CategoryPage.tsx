import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { BookGrid } from "../components/BookCard";
import { Empty, PageHeader, PageLoader } from "../components/ui";
import { useCategoryQuery } from "../features/api";
import { apiError } from "../lib/format";

export function CategoryPage() {
  const { slug = "" } = useParams();
  const category = useCategoryQuery(slug, { skip: !slug });

  useEffect(() => {
    if (category.data) document.title = `${category.data.name} · Folio`;
  }, [category.data]);

  if (category.isLoading) return <PageLoader />;
  if (category.isError || !category.data) return <Empty title="Category not found" text={apiError(category.error)} />;

  const item = category.data;
  return (
    <div>
      <PageHeader
        kicker="Category"
        title={item.name}
        text={item.description || "Published books filed under this category."}
        action={
          <Link to={`/?category=${item.id}`} className="text-sm font-semibold text-pine">
            Open in catalog
          </Link>
        }
      />
      {item.books && item.books.length > 0 ? (
        <BookGrid books={item.books} />
      ) : (
        <Empty title="No published books here yet" />
      )}
    </div>
  );
}
