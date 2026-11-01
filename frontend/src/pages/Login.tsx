import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/store";
import { Banner, Button, Field, PasswordInput, TextInput } from "../components/ui";
import { useLoginMutation } from "../features/api";
import { setCredentials } from "../features/authSlice";
import { apiError, homeFor } from "../lib/format";

export function Login() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from || homeFor(user?.role);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, state] = useLoginMutation();

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      const destination = from && from !== "/login" ? from : homeFor(result.user.role);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(apiError(caught));
    }
  }

  return (
    <AuthFrame title="Welcome back" text="Sign in to save books, request loans, or open your studio.">
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? <Banner>{error}</Banner> : null}
        <Field label="Email">
          <TextInput type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Button type="submit" busy={state.isLoading} className="w-full">
          Sign in
        </Button>
        <p className="text-sm text-mute">
          <Link to="/forgot-password" className="font-semibold text-pine">Forgot password</Link>
          <span> · </span>
          <Link to="/register" className="font-semibold text-pine">Create an account</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function AuthFrame({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="grid overflow-hidden rounded-3xl border border-line bg-card shadow-card lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden bg-ink p-10 text-paper lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Folio</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight">{title}</h1>
        <p className="mt-4 max-w-sm text-white/70">{text}</p>
        <ul className="mt-10 space-y-3 text-sm text-white/80">
          <li>Readers borrow copies that are in stock.</li>
          <li>Authors draft books and submit them for review.</li>
          <li>Admins approve titles, categories, and loans.</li>
        </ul>
      </aside>
      <div className="p-6 sm:p-10">
        <h1 className="mb-6 font-serif text-3xl lg:hidden">{title}</h1>
        {children}
      </div>
    </div>
  );
}
