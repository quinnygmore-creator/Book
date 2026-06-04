import { ThemeId } from '../theme/themes';

/**
 * A "book" — the emotional alternative to a folder. Entries (recordings
 * with their cleaned page) belong to a book via `Recording.bookId`.
 *
 * Maps onto the `books` table in supabase/migrations/0001_init.sql.
 */
export interface Book {
  id: string;
  title: string;
  coverEmoji?: string;
  theme?: ThemeId; // reading theme for this book's pages
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
