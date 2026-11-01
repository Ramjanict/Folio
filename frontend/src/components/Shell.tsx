import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LuMenu, LuSearch, LuX } from "react-icons/lu";
import { useAppDispatch, useAppSelector } from "../app/store";
import { api, useLogoutMutation, useMeQuery } from "../features/api";
import { clearAuth, setUser } from "../features/authSlice";
import { cx, label } from "../lib/format";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "rounded px-2 py-1 text-sm transition",
    isActive ? "bg-white/15 text-white" : "text-white/75 hover:text-white",
  );

export function Shell() {
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useMeQuery(undefined, { skip: !accessToken });
  const [logout] = useLogoutMutation();

  useEffect(() => {
    if (data) dispatch(setUser(data));
  }, [data, dispatch]);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
    if (location.pathname === "/") {
      setSearch(new URLSearchParams(location.search).get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  const links = [
    { to: "/", label: "Catalog", show: true },
    { to: "/favorites", label: "Saved", show: Boolean(user) },
    { to: "/borrows", label: "Loans", show: Boolean(user && user.role !== "AUTHOR") },
    { to: "/studio", label: "Studio", show: user?.role === "AUTHOR" || user?.role === "ADMIN" },
    { to: "/admin", label: "Admin", show: user?.role === "ADMIN" },
  ];
  const visible = links.filter((item) => item.show);

  async function signOut() {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } finally {
      dispatch(clearAuth());
      dispatch(api.util.resetApiState());
      navigate("/");
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/?q=${encodeURIComponent(term)}` : "/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-[#2c2a28] text-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-3">
          <button
            className="rounded p-1.5 text-white lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <LuX /> : <LuMenu />}
          </button>
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded bg-pine font-serif text-sm">F</span>
            <span className="hidden font-serif text-sm tracking-wide sm:block">Folio</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {visible.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <form onSubmit={submitSearch} className="relative mx-auto hidden min-w-0 max-w-md flex-1 md:block">
            <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search books"
              className="w-full rounded border border-white/10 bg-white py-1.5 pl-8 pr-3 text-sm text-ink outline-none"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm transition hover:bg-white/10"
                  onClick={() => setMenu((value) => !value)}
                  aria-expanded={menu}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-pine text-xs font-semibold">
                    {user.name.slice(0, 1)}
                  </span>
                  <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {label(user.role)}
                  </span>
                </button>
                {menu ? (
                  <div className="animate-menu absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-line bg-card py-1 text-ink shadow-card">
                    <Link to="/profile" className="block px-3 py-2 text-sm transition hover:bg-paper">
                      Profile
                    </Link>
                    <button className="block w-full px-3 py-2 text-left text-sm transition hover:bg-paper" onClick={signOut}>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link to="/login" className="px-2 py-1 text-sm text-white/80 hover:text-white">
                  Log in
                </Link>
                <Link to="/register" className="rounded bg-pine px-3 py-1 text-sm font-semibold text-white hover:bg-pine-dark">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
        {open ? (
          <div className="animate-menu space-y-2 border-t border-white/10 px-3 py-3 lg:hidden">
            <form onSubmit={submitSearch}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                aria-label="Search books"
                className="w-full rounded border border-white/10 bg-white px-3 py-1.5 text-sm text-ink outline-none"
              />
            </form>
            <nav className="flex flex-col">
              {visible.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4">
        <div key={location.pathname} className="animate-fade border border-[#d9d3c7] bg-white shadow-sm">
          <div className="px-4 py-5 sm:px-6">
            <Outlet />
          </div>
          <footer className="border-t border-[#ece7df] px-4 py-8 text-sm sm:px-6">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Browse</p>
                <div className="mt-3 flex flex-col gap-1.5 text-ink/80">
                  <Link to="/" className="w-fit hover:underline">Catalog</Link>
                  <Link to="/favorites" className="w-fit hover:underline">Saved books</Link>
                  <Link to="/borrows" className="w-fit hover:underline">Loans</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Account</p>
                <div className="mt-3 flex flex-col gap-1.5 text-ink/80">
                  {user ? (
                    <Link to="/profile" className="w-fit hover:underline">Profile</Link>
                  ) : (
                    <>
                      <Link to="/login" className="w-fit hover:underline">Log in</Link>
                      <Link to="/register" className="w-fit hover:underline">Sign up</Link>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">About</p>
                <p className="mt-3 max-w-xs leading-6 text-mute">
                  Folio is a lending shelf for readers, authors, and the admins who publish the books.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>
      <div className="bg-[#2c2a28] py-2 text-center text-[11px] text-white/50">© 2026 Folio</div>
    </div>
  );
}
