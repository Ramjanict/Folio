import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LuBookOpen,
  LuChevronDown,
  LuHome,
  LuLayoutGrid,
  LuLibrary,
  LuLogOut,
  LuMenu,
  LuPenLine,
  LuSearch,
  LuUser,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { useAppDispatch, useAppSelector } from "../app/store";
import { api, useLogoutMutation, useMeQuery } from "../features/api";
import { clearAuth, setUser } from "../features/authSlice";
import { cx } from "../lib/format";

type NavIcon = typeof LuHome;

export type DashboardItem = {
  to: string;
  label: string;
  icon: NavIcon;
  end?: boolean;
};

const adminItems: DashboardItem[] = [
  { to: "/admin", label: "Overview", icon: LuHome, end: true },
  { to: "/admin/books", label: "Books", icon: LuBookOpen, end: false },
  { to: "/admin/categories", label: "Categories", icon: LuLayoutGrid, end: false },
  { to: "/admin/users", label: "People", icon: LuUsers, end: false },
  { to: "/admin/borrows", label: "Loans", icon: LuLibrary, end: false },
  { to: "/admin/profile", label: "Profile", icon: LuUser, end: true },
  { to: "/admin/author", label: "Author page", icon: LuPenLine, end: true },
];

export function AdminShell() {
  return <DashboardShell items={adminItems} home="/admin" searchTo="/admin/books" />;
}

export function DashboardShell({
  items,
  home,
  searchTo,
}: {
  items: DashboardItem[];
  home: string;
  searchTo: string;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [menu, setMenu] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { data } = useMeQuery(undefined, { skip: !accessToken });
  const [logout] = useLogoutMutation();

  useEffect(() => {
    if (data) dispatch(setUser(data));
  }, [data, dispatch]);

  useEffect(() => {
    setMenu(false);
    setNavOpen(false);
    setSearch(new URLSearchParams(location.search).get("q") ?? "");
  }, [location.pathname, location.search]);

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
    navigate(term ? `${searchTo}?q=${encodeURIComponent(term)}` : searchTo);
  }

  return (
    <div className="min-h-screen bg-[#e7edf6] p-3 sm:p-4">
      <div className="flex min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(28,45,84,0.08)] sm:min-h-[calc(100vh-2rem)]">
        <aside
          className={cx(
            "fixed inset-y-3 left-3 z-40 flex w-60 flex-col rounded-[28px] bg-white px-4 py-5 shadow-xl transition md:static md:inset-auto md:z-auto md:w-56 md:translate-x-0 md:rounded-none md:shadow-none",
            navOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0",
          )}
        >
          <Link to={home} className="flex items-center gap-2.5 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef3ff] text-[#3b6fe8]">
              <LuHome className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-semibold text-ink">Folio</span>
          </Link>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive ? "bg-[#eef3ff] text-[#3b6fe8]" : "text-[#8b93a7] hover:bg-[#f4f7fb] hover:text-ink",
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#8b93a7] transition hover:bg-[#f4f7fb] hover:text-ink"
          >
            <LuLogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </aside>
        {navOpen ? (
          <button className="fixed inset-0 z-30 bg-ink/20 md:hidden" aria-label="Close menu" onClick={() => setNavOpen(false)} />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col border-l border-[#f0f2f6]">
          <header className="flex items-center gap-3 px-4 py-4 sm:px-6">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl text-[#8b93a7] md:hidden"
              aria-label="Menu"
              onClick={() => setNavOpen((value) => !value)}
            >
              {navOpen ? <LuX /> : <LuMenu />}
            </button>
            <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
              <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0a7b5]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search books"
                aria-label="Search books"
                className="w-full rounded-xl border border-[#e6eaf1] bg-[#f7f8fb] py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-[#c5d4f6] focus:bg-white"
              />
            </form>
            {user ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-[#f4f7fb]"
                  aria-expanded={menu}
                  onClick={() => setMenu((value) => !value)}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7eefc] text-sm font-semibold text-[#3b6fe8]">
                    {user.name.slice(0, 1)}
                  </span>
                  <span className="hidden max-w-28 truncate text-sm font-medium text-ink sm:inline">{user.name}</span>
                  <LuChevronDown className="hidden h-4 w-4 text-[#8b93a7] sm:block" />
                </button>
                {menu ? (
                  <div className="animate-menu absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-[#eef0f4] bg-white py-1 text-sm shadow-card">
                    <Link to={`${home}/profile`} className="block px-3 py-2 hover:bg-[#f4f7fb]">
                      Profile
                    </Link>
                    <Link to={`${home}/author`} className="block px-3 py-2 hover:bg-[#f4f7fb]">
                      Author page
                    </Link>
                    {user.role === "ADMIN" && home !== "/admin" ? (
                      <Link to="/admin" className="block px-3 py-2 hover:bg-[#f4f7fb]">
                        Admin
                      </Link>
                    ) : null}
                    {user.role !== "USER" && home !== "/studio" ? (
                      <Link to="/studio" className="block px-3 py-2 hover:bg-[#f4f7fb]">
                        Studio
                      </Link>
                    ) : null}
                    <button type="button" className="block w-full px-3 py-2 text-left hover:bg-[#f4f7fb]" onClick={signOut}>
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </header>
          <main className="flex-1 overflow-auto bg-[#f6f8fc] px-4 py-5 sm:px-6">
            <div key={location.pathname} className="animate-fade">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
