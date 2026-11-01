import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../app/store";
import CommonSelect from "../components/CommonSelect";
import { Banner, Button, Field, PageHeader, PageLoader, TextArea, TextInput } from "../components/ui";
import { useBookQuery, useCategoriesQuery, useCreateBookMutation, useUpdateBookMutation } from "../features/api";
import { apiError, withProtocol } from "../lib/format";
import type { BookInput, BookStatus } from "../types";

const empty = {
  title: "",
  categoryId: "",
  description: "",
  isbn: "",
  coverImage: "",
  language: "English",
  pageCount: "",
  publishedYear: "",
  price: "",
  stockQuantity: "1",
  status: "DRAFT" as BookStatus,
};

export function BookForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const user = useAppSelector((state) => state.auth.user);
  const existing = useBookQuery(id ?? "", { skip: !id });
  const categories = useCategoriesQuery();
  const [createBook, createState] = useCreateBookMutation();
  const [updateBook, updateState] = useUpdateBookMutation();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const book = existing.data;
    if (!book) return;
    setForm({
      title: book.title,
      categoryId: book.categoryId || book.category?.id || "",
      description: book.description ?? "",
      isbn: book.isbn ?? "",
      coverImage: book.coverImage ?? "",
      language: book.language || "English",
      pageCount: book.pageCount ? String(book.pageCount) : "",
      publishedYear: book.publishedYear ? String(book.publishedYear) : "",
      price: book.price !== undefined && book.price !== null ? String(book.price) : "",
      stockQuantity: book.stockQuantity !== undefined ? String(book.stockQuantity) : "1",
      status: book.status || "DRAFT",
    });
  }, [existing.data]);

  const allowed: BookStatus[] = user?.role === "ADMIN"
    ? ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]
    : ["DRAFT", "PENDING_REVIEW"];
  const statuses = form.status && !allowed.includes(form.status) ? [form.status, ...allowed] : allowed;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function payload(): BookInput {
    const body: BookInput = {
      title: form.title.trim(),
      categoryId: form.categoryId,
      description: form.description.trim() || undefined,
      isbn: form.isbn.trim() || undefined,
      coverImage: withProtocol(form.coverImage),
      language: form.language.trim() || undefined,
      pageCount: form.pageCount ? Number(form.pageCount) : undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
      price: form.price === "" ? undefined : Number(form.price),
      stockQuantity: form.stockQuantity === "" ? undefined : Number(form.stockQuantity),
    };
    if (!isEdit || form.status !== existing.data?.status) body.status = form.status;
    return body;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    if (!form.categoryId) {
      setError("Choose a category");
      return;
    }
    try {
      if (isEdit && id) {
        await updateBook({ id, ...payload() }).unwrap();
        setNote("Book saved");
      } else {
        await createBook(payload()).unwrap();
        navigate("/studio");
      }
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  if (isEdit && existing.isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        kicker="Studio"
        title={isEdit ? "Edit book" : "New book"}
        text="Authors can keep a draft or submit it for review. Publishing is an admin action."
        action={<Link to="/studio" className="text-sm font-semibold text-pine">Back to studio</Link>}
      />
      {categories.data && categories.data.length === 0 ? (
        <div className="mb-4"><Banner>An admin needs to add a category before a book can be filed.</Banner></div>
      ) : null}
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      {note ? <div className="mb-4"><Banner tone="ok">{note}</Banner></div> : null}
      <form className="grid gap-4 rounded-2xl border border-line bg-card p-5 shadow-card md:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Title">
          <TextInput required value={form.title} onChange={(event) => set("title", event.target.value)} />
        </Field>
        <Field label="Category">
          <CommonSelect
            aria-label="Category"
            value={form.categoryId || undefined}
            placeholder="Choose a category"
            item={(categories.data ?? []).map((category) => ({ value: category.id, label: category.name }))}
            onValueChange={(value) => set("categoryId", value)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <TextArea value={form.description} onChange={(event) => set("description", event.target.value)} />
          </Field>
        </div>
        <Field label="Cover image URL">
          <TextInput value={form.coverImage} onChange={(event) => set("coverImage", event.target.value)} placeholder="https://" />
        </Field>
        <Field label="ISBN">
          <TextInput value={form.isbn} onChange={(event) => set("isbn", event.target.value)} />
        </Field>
        <Field label="Language">
          <TextInput value={form.language} onChange={(event) => set("language", event.target.value)} />
        </Field>
        <Field label="Status">
          <CommonSelect
            aria-label="Status"
            value={form.status}
            item={statuses.map((status) => ({
              value: status,
              label:
                status === "PENDING_REVIEW"
                  ? "Submit for review"
                  : status === "DRAFT"
                    ? "Draft"
                    : status === "PUBLISHED"
                      ? "Published"
                      : "Archived",
            }))}
            onValueChange={(value) => set("status", value)}
          />
        </Field>
        <Field label="Pages">
          <TextInput type="number" min={1} value={form.pageCount} onChange={(event) => set("pageCount", event.target.value)} />
        </Field>
        <Field label="Published year">
          <TextInput type="number" min={1000} value={form.publishedYear} onChange={(event) => set("publishedYear", event.target.value)} />
        </Field>
        <Field label="Price">
          <TextInput type="number" min={0} step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} />
        </Field>
        <Field label="Copies in stock">
          <TextInput type="number" min={0} value={form.stockQuantity} onChange={(event) => set("stockQuantity", event.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" busy={createState.isLoading || updateState.isLoading}>
            {isEdit ? "Save changes" : "Create book"}
          </Button>
        </div>
      </form>
    </div>
  );
}
