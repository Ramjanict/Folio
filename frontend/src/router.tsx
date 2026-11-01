import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminShell } from "./components/AdminShell";
import { AuthorShell } from "./components/AuthorShell";
import { RequireAuth } from "./components/Guard";
import { Shell } from "./components/Shell";
import { AdminBooks } from "./pages/AdminBooks";
import { AdminBorrows } from "./pages/AdminBorrows";
import { AdminCategories } from "./pages/AdminCategories";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminUsers } from "./pages/AdminUsers";
import { AuthorBooks } from "./pages/AuthorBooks";
import { AuthorPage, DashboardAuthorPage } from "./pages/AuthorPage";
import { BookDetails } from "./pages/BookDetails";
import { BookForm } from "./pages/BookForm";
import { Borrows } from "./pages/Borrows";
import { CategoryPage } from "./pages/CategoryPage";
import { Favorites } from "./pages/Favorites";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Forbidden } from "./pages/Forbidden";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";
import { ResetPassword } from "./pages/ResetPassword";
import { Studio } from "./pages/Studio";

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: <RequireAuth roles={["ADMIN"]} />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "books", element: <AdminBooks /> },
          { path: "categories", element: <AdminCategories /> },
          { path: "users", element: <AdminUsers /> },
          { path: "borrows", element: <AdminBorrows /> },
          { path: "profile", element: <Profile /> },
          { path: "author", element: <DashboardAuthorPage /> },
        ],
      },
    ],
  },
  {
    path: "/studio",
    element: <RequireAuth roles={["AUTHOR", "ADMIN"]} />,
    children: [
      {
        element: <AuthorShell />,
        children: [
          { index: true, element: <Studio /> },
          { path: "books", element: <AuthorBooks /> },
          { path: "books/new", element: <BookForm /> },
          { path: "books/:id/edit", element: <BookForm /> },
          { path: "profile", element: <Profile /> },
          { path: "author", element: <DashboardAuthorPage /> },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Home /> },
      { path: "books/:id", element: <BookDetails /> },
      { path: "categories/:slug", element: <CategoryPage /> },
      { path: "authors/:id", element: <AuthorPage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "forbidden", element: <Forbidden /> },
      { path: "wishlists", element: <Navigate to="/favorites" replace /> },
      { path: "cart", element: <Navigate to="/borrows" replace /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "favorites", element: <Favorites /> },
          { path: "profile", element: <Profile /> },
        ],
      },
      {
        element: <RequireAuth roles={["USER", "ADMIN"]} />,
        children: [{ path: "borrows", element: <Borrows /> }],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
