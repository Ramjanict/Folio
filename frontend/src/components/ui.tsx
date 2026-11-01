import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { cx } from "../lib/format";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost" | "danger" | "ink";
  busy?: boolean;
};

export function Button({
  tone = "primary",
  busy,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const tones = {
    primary: "bg-pine text-white hover:bg-pine-dark",
    ghost: "border border-line bg-card text-ink hover:bg-paper",
    danger: "border border-red-200 bg-card text-clay hover:bg-red-50",
    ink: "bg-ink text-paper hover:bg-black",
  };

  return (
    <button
      type={type}
      disabled={disabled || busy}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        tones[tone],
        className,
      )}
      {...props}
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-clay">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-sm text-mute">{hint}</span> : null}
    </label>
  );
}

const control =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-stone-400 focus:border-pine";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(control, props.className)} />;
}

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cx(control, "pr-11", className)}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-mute transition hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <LuEyeOff aria-hidden className="h-4 w-4" /> : <LuEye aria-hidden className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(control, "min-h-28 resize-y", props.className)} />;
}

export function Banner({ tone = "error", children }: { tone?: "error" | "ok"; children: ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "error" ? "border-red-200 bg-red-50 text-clay" : "border-pine/20 bg-pine-soft text-pine-dark",
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

export function PageHeader({
  kicker,
  title,
  text,
  action,
}: {
  kicker?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">{kicker}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink sm:text-4xl">{title}</h1>
        {text ? <p className="mt-2 text-mute">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm text-mute">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-[#e7e0d6]", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-mute">Loading the library…</div>
  );
}

export function Pager({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button tone="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-mute">
        Page {page} of {total}
      </span>
      <Button tone="ghost" disabled={page >= total} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-2xl border border-line bg-card p-5 shadow-card", className)}>{children}</section>;
}
