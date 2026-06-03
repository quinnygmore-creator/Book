/**
 * Local-first persistence for books. Mirrors the `books` table; swaps to
 * Supabase SDK calls (insert/update/delete) when auth + sync land.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../types/book';

const KEY = 'books.books.v1';

// Cover emojis are auto-assigned in rotation so the shelf looks varied.
const EMOJIS = ['📓', '💡', '✈️', '🍳', '🏋️', '🎨', '📚', '🌙', '🌱', '🎯'];

async function writeAll(books: Book[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(books));
}

/** Return all books, oldest first (shelf order). */
export async function listBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const books: Book[] = raw ? JSON.parse(raw) : [];
  return books.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createBook(title: string): Promise<Book> {
  const books = await listBooks();
  const now = new Date().toISOString();
  const book: Book = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    coverEmoji: EMOJIS[books.length % EMOJIS.length],
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...books, book]);
  return book;
}

export async function renameBook(id: string, title: string): Promise<void> {
  const books = await listBooks();
  await writeAll(
    books.map((b) =>
      b.id === id ? { ...b, title: title.trim(), updatedAt: new Date().toISOString() } : b
    )
  );
}

export async function deleteBook(id: string): Promise<void> {
  const books = await listBooks();
  await writeAll(books.filter((b) => b.id !== id));
}
