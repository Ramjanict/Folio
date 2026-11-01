import { LuBookOpen, LuHome, LuPenLine, LuPlus, LuUser } from "react-icons/lu";
import { DashboardShell, type DashboardItem } from "./AdminShell";

const items: DashboardItem[] = [
  { to: "/studio", label: "Overview", icon: LuHome, end: true },
  { to: "/studio/books", label: "Books", icon: LuBookOpen, end: true },
  { to: "/studio/books/new", label: "New book", icon: LuPlus, end: true },
  { to: "/studio/profile", label: "Profile", icon: LuUser, end: true },
  { to: "/studio/author", label: "Author page", icon: LuPenLine, end: true },
];

export function AuthorShell() {
  return <DashboardShell items={items} home="/studio" searchTo="/studio/books" />;
}
