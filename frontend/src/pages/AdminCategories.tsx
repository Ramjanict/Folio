import { useState, type FormEvent } from "react";
import { Banner, Button, Field, PageHeader, Panel, TextArea, TextInput } from "../components/ui";
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from "../features/api";
import { apiError } from "../lib/format";
import type { Category } from "../types";

export function AdminCategories() {
  const categories = useCategoriesQuery();
  const [createCategory, createState] = useCreateCategoryMutation();
  const [updateCategory, updateState] = useUpdateCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function edit(category: Category) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setError("");
    setNote("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    try {
      if (editing) {
        await updateCategory({ id: editing.id, name: name.trim(), description: description.trim() || undefined }).unwrap();
        setNote("Category updated");
      } else {
        await createCategory({ name: name.trim(), description: description.trim() || undefined }).unwrap();
        setNote("Category created");
      }
      setEditing(null);
      setName("");
      setDescription("");
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  return (
    <div>
      <PageHeader kicker="Admin" title="Categories" text="A category with books cannot be deleted until those books are moved or removed." />
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      {note ? <div className="mb-4"><Banner tone="ok">{note}</Banner></div> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {categories.data?.map((category) => (
            <Panel key={category.id} className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl">{category.name}</h2>
                <p className="text-sm text-mute">{category.description || "No description"} · {category._count?.books ?? 0} published</p>
              </div>
              <div className="flex gap-2">
                <Button tone="ghost" onClick={() => edit(category)}>Edit</Button>
                <Button
                  tone="danger"
                  onClick={async () => {
                    if (!window.confirm(`Delete ${category.name}?`)) return;
                    setError("");
                    try {
                      const result = await remove(category.id).unwrap();
                      setNote(result.message);
                    } catch (caught) {
                      setError(apiError(caught));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Panel>
          ))}
          {categories.data?.length === 0 ? <Panel><p className="text-sm text-mute">No categories yet.</p></Panel> : null}
        </div>
        <Panel>
          <h2 className="font-serif text-xl">{editing ? "Edit category" : "New category"}</h2>
          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <Field label="Name">
              <TextInput required value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Description">
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" busy={createState.isLoading || updateState.isLoading}>{editing ? "Save" : "Create"}</Button>
              {editing ? (
                <Button tone="ghost" onClick={() => { setEditing(null); setName(""); setDescription(""); }}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
