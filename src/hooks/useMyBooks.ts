import { useEffect, useState } from "react";
import type { Book } from "@/types/book";

export function useMyBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/books");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setBooks(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message ?? "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return { books, loading, error, refetch: fetchBooks };
}
