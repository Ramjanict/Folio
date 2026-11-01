export type Role = "USER" | "AUTHOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING";
export type BookStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
export type BorrowStatus =
  | "REQUESTED"
  | "APPROVED"
  | "BORROWED"
  | "RETURNED"
  | "OVERDUE"
  | "CANCELLED";

export interface AuthorProfile {
  id: string;
  penName?: string | null;
  bio?: string | null;
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  user?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  };
  books?: Book[];
  _count?: { books: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  authorProfile?: AuthorProfile | null;
  _count?: { reviews: number; borrowRecords: number; favorites: number };
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  isbn?: string | null;
  description?: string | null;
  coverImage?: string | null;
  pageCount?: number | null;
  publishedYear?: number | null;
  language?: string;
  price?: string | number | null;
  stockQuantity?: number;
  status?: BookStatus;
  categoryId?: string;
  category?: { id: string; name: string; slug: string } | null;
  author?: {
    id?: string;
    penName?: string | null;
    user?: { id: string; name: string; avatar?: string | null; email?: string };
  } | null;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { reviews?: number; borrowRecords?: number; favorites?: number };
  reviews?: Review[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { books: number };
  books?: Book[];
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar?: string | null };
}

export interface BorrowRecord {
  id: string;
  status: BorrowStatus;
  borrowDate?: string | null;
  dueDate?: string | null;
  returnDate?: string | null;
  returnRequestedAt?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  book?: {
    id: string;
    title: string;
    slug?: string;
    coverImage?: string | null;
    stockQuantity?: number;
    author?: { penName?: string | null };
  };
}

export interface FavoriteItem {
  favoriteId: string;
  savedAt: string;
  book: Book;
}

export interface Page<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface BookQuery {
  search?: string;
  categoryId?: string;
  status?: BookStatus;
  page?: number;
  limit?: number;
  sort?: "latest" | "oldest" | "price_asc" | "price_desc" | "title_asc";
  minPrice?: number;
  maxPrice?: number;
}

export interface UserQuery {
  search?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface BookInput {
  title: string;
  categoryId: string;
  description?: string;
  isbn?: string;
  coverImage?: string;
  language?: string;
  pageCount?: number;
  publishedYear?: number;
  price?: number;
  stockQuantity?: number;
  status?: BookStatus;
}
