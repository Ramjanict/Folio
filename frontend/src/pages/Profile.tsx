import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Banner, Button, Field, PageHeader, Panel, TextArea, TextInput } from "../components/ui";
import { useAppSelector } from "../app/store";
import { useMyAuthorQuery, useUpdateAuthorMutation, useUpdateProfileMutation } from "../features/api";
import { apiError, withProtocol } from "../lib/format";

export function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const isAuthor = user?.role === "AUTHOR" || user?.role === "ADMIN";
  const author = useMyAuthorQuery(undefined, { skip: !isAuthor });
  const [updateProfile, profileState] = useUpdateProfileMutation();
  const [updateAuthor, authorState] = useUpdateAuthorMutation();
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!author.data) return;
    setPenName(author.data.penName ?? "");
    setBio(author.data.bio ?? "");
    setWebsite(author.data.website ?? "");
    const first = author.data.socialLinks ? Object.entries(author.data.socialLinks)[0] : undefined;
    setLinkLabel(first?.[0] ?? "");
    setLinkUrl(first?.[1] ?? "");
  }, [author.data]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    try {
      const result = await updateProfile({ name: name.trim(), avatar: withProtocol(avatar) }).unwrap();
      setNote(result.message);
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  async function saveAuthor(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    const social = linkLabel.trim() && linkUrl.trim() ? { [linkLabel.trim()]: withProtocol(linkUrl) || linkUrl.trim() } : {};
    try {
      await updateAuthor({
        penName: penName.trim() || undefined,
        bio: bio.trim(),
        website: withProtocol(website),
        socialLinks: social,
      }).unwrap();
      setNote("Author profile saved");
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  if (user?.role === "ADMIN" && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin/profile" replace />;
  }
  if (user?.role === "AUTHOR" && !location.pathname.startsWith("/studio")) {
    return <Navigate to="/studio/profile" replace />;
  }

  return (
    <div>
      <PageHeader kicker="Account" title="Profile" text="Your name is public on reviews. Author details appear on your public page." />
      {error ? <div className="mb-4"><Banner>{error}</Banner></div> : null}
      {note ? <div className="mb-4"><Banner tone="ok">{note}</Banner></div> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-serif text-2xl">Reader profile</h2>
          <form className="mt-4 space-y-4" onSubmit={saveProfile}>
            <Field label="Name">
              <TextInput required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Avatar URL" hint="Optional. Include a full address, or we will add https://">
              <TextInput value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://" />
            </Field>
            <p className="text-sm text-mute">{user?.email}</p>
            <Button type="submit" busy={profileState.isLoading}>Save profile</Button>
          </form>
        </Panel>
        {isAuthor ? (
          <Panel>
            <h2 className="font-serif text-2xl">Author profile</h2>
            {author.isError && user?.role === "AUTHOR" ? (
              <p className="mt-2 text-sm text-mute">No profile yet. Saving will create one.</p>
            ) : null}
            <form className="mt-4 space-y-4" onSubmit={saveAuthor}>
              <Field label="Pen name">
                <TextInput value={penName} onChange={(event) => setPenName(event.target.value)} />
              </Field>
              <Field label="Bio">
                <TextArea value={bio} onChange={(event) => setBio(event.target.value)} />
              </Field>
              <Field label="Website">
                <TextInput value={website} onChange={(event) => setWebsite(event.target.value)} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Link label">
                  <TextInput value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="Journal" />
                </Field>
                <Field label="Link URL">
                  <TextInput value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" />
                </Field>
              </div>
              <Button type="submit" busy={authorState.isLoading}>Save author profile</Button>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
