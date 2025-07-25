import type { Book } from "@/types/book";

export type CreateBookInput = {
  title: string;
  author: string;
  isbn: string;
  coverUrl?: string | null;
};

/**
 * Centralized API boundary for all book persistence.
 * If/when you move to a real backend (or change endpoints),
 * you only need to touch this file.
 */
export const bookRepository = {
  /**
   * Persist a new book for the current (authenticated) user.
   */
  async addBook(input: CreateBookInput): Promise<Book> {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to add book");
    }

    return res.json();
  },

  /**
   * Optional (future): fetch all books for the user via a GET route.
   * Keep here for when you add GET /api/books.
   */
  async list(): Promise<Book[]> {
    const res = await fetch("/api/books");
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to load books");
    }
    return res.json();
  },

  /**
   * Optional (future): delete a book via /api/books/[id]
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to delete book");
    }
  },
};
