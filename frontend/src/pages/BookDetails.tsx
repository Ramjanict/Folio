import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuHeart } from "react-icons/lu";
import { useAppSelector } from "../app/store";
import { Banner, Button, Empty, PageLoader, Panel, TextArea } from "../components/ui";
import {
  useBookQuery,
  useBookReviewsQuery,
  useDeleteReviewMutation,
  useFavoriteCheckQuery,
  useRequestBorrowMutation,
  useSaveReviewMutation,
  useToggleFavoriteMutation,
} from "../features/api";
import { apiError, authorName, coverTone, day, label, money, statusTone } from "../lib/format";

export function BookDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const book = useBookQuery(id, { skip: !id });
  const reviews = useBookReviewsQuery(id, { skip: !id });
  const favorite = useFavoriteCheckQuery(id, { skip: !id || !user });
  const [toggleFavorite, favoriteState] = useToggleFavoriteMutation();
  const [borrow, borrowState] = useRequestBorrowMutation();
  const [saveReview, reviewState] = useSaveReviewMutation();
  const [removeReview] = useDeleteReviewMutation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (book.data) document.title = `${book.data.title} · Folio`;
  }, [book.data]);

  if (book.isLoading) return <PageLoader />;
  if (book.isError || !book.data) {
    return <Empty title="This book is not on the shelf" text={apiError(book.error)} />;
  }

  const item = book.data;
  const canBorrow = !user || user.role === "USER" || user.role === "ADMIN";
  const price = money(item.price);
  const mine = reviews.data?.find((review) => review.user.id === user?.id);

  async function onFavorite() {
    if (!user) {
      navigate("/login", { state: { from: `/books/${id}` } });
      return;
    }
    setError("");
    try {
      const result = await toggleFavorite(id).unwrap();
      setNote(result.message);
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  async function onBorrow() {
    if (!user) {
      navigate("/login", { state: { from: `/books/${id}` } });
      return;
    }
    setError("");
    setNote("");
    try {
      const result = await borrow({ bookId: id }).unwrap();
      setNote(result.message);
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  async function onReview(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await saveReview({ bookId: id, rating, comment: comment.trim() || undefined }).unwrap();
      setNote(result.message);
      setComment("");
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="overflow-hidden rounded-2xl border border-line bg-card" style={{ background: coverTone(item.title) }}>
        {item.coverImage && !imageFailed ? (
          <img src={item.coverImage} alt="" className="aspect-[3/4] w-full object-cover" onError={() => setImageFailed(true)} />
        ) : (
          <div className="grid aspect-[3/4] place-items-center font-serif text-7xl text-ink/60">{item.title.slice(0, 1)}</div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {item.category ? (
            <Link to={`/categories/${item.category.slug}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">
              {item.category.name}
            </Link>
          ) : null}
          {item.status && item.status !== "PUBLISHED" ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(item.status)}`}>{label(item.status)}</span>
          ) : null}
        </div>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-ink">{item.title}</h1>
        {item.author?.id ? (
          <Link to={`/authors/${item.author.id}`} className="mt-2 inline-block text-lg text-mute hover:text-ink">
            {authorName(item)}
          </Link>
        ) : (
          <p className="mt-2 text-lg text-mute">{authorName(item)}</p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Meta label="Year" value={item.publishedYear ? String(item.publishedYear) : "—"} />
          <Meta label="Language" value={item.language || "—"} />
          <Meta label="Pages" value={item.pageCount ? String(item.pageCount) : "—"} />
          <Meta label="Stock" value={typeof item.stockQuantity === "number" ? String(item.stockQuantity) : "—"} />
        </dl>

        <p className="mt-5 max-w-2xl leading-7 text-ink/80">{item.description || "No description yet."}</p>
        <p className="mt-3 text-sm text-mute">
          {item.totalReviews ? `${item.averageRating?.toFixed(1)} average from ${item.totalReviews} reviews` : "No reviews yet"}
          {price ? ` · ${price}` : ""}
          {item.isbn ? ` · ISBN ${item.isbn}` : ""}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button tone="ghost" busy={favoriteState.isLoading} onClick={onFavorite}>
            <LuHeart className={favorite.data?.isFavorited ? "fill-current text-clay" : ""} />
            {favorite.data?.isFavorited ? "Saved" : "Save"}
          </Button>
          {canBorrow ? (
            <Button busy={borrowState.isLoading} disabled={item.stockQuantity === 0} onClick={onBorrow}>
              {item.stockQuantity === 0 ? "Out of stock" : "Request loan"}
            </Button>
          ) : null}
        </div>
        {canBorrow ? <p className="mt-2 text-sm text-mute">A loan runs for 14 days unless you are already waiting on this copy.</p> : null}
        {note ? <div className="mt-4"><Banner tone="ok">{note}</Banner></div> : null}
        {error ? <div className="mt-4"><Banner>{error}</Banner></div> : null}
      </div>

      <Panel className="lg:col-span-2">
        <h2 className="font-serif text-2xl">Reviews</h2>
        {user ? (
          <form className="mt-4 space-y-3" onSubmit={onReview}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`text-2xl ${value <= rating ? "text-gold" : "text-stone-300"}`}
                  onClick={() => setRating(value)}
                  aria-label={`${value} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <TextArea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={mine ? "Update your review" : "What should the next reader know?"} />
            <Button type="submit" busy={reviewState.isLoading}>
              {mine ? "Update review" : "Publish review"}
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-mute">
            <Link to="/login" state={{ from: `/books/${id}` }} className="font-semibold text-pine">
              Sign in
            </Link>{" "}
            to review this book.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {reviews.isLoading ? <p className="text-sm text-mute">Loading reviews…</p> : null}
          {reviews.data?.length === 0 ? <p className="text-sm text-mute">No reader notes yet.</p> : null}
          {reviews.data?.map((review) => (
            <article key={review.id} className="border-t border-line pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{review.user.name}</p>
                  <p className="text-sm text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                </div>
                <div className="text-right text-sm text-mute">
                  <p>{day(review.createdAt)}</p>
                  {user && (user.id === review.user.id || user.role === "ADMIN") ? (
                    <button className="mt-1 text-clay" onClick={() => removeReview(review.id)}>
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              {review.comment ? <p className="mt-2 text-sm leading-6 text-ink/80">{review.comment}</p> : null}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Meta({ label: name, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2">
      <dt className="text-xs uppercase tracking-wider text-mute">{name}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
