"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Image from "next/image";
import BarcodeScanner from "@/components/BarcodeScanner";
import type { BookInfo, Book } from "@/types/book";
import { bookRepository } from "@/repositories/bookRepository";
import BookFoundModal from "@/components/BookFoundModal";
import { mapBookInfoToCreateBookInput } from "@/lib/utils";

export default function MyBooksClient({
  initialBooks,
}: {
  initialBooks: Book[];
}) {
  const [query, setQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(initialBooks);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [lastUsedIsbn, setLastUsedIsbn] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const search = useCallback(
    (q: string) => {
      const normalized = q.toLowerCase().trim();
      if (!normalized) return books;
      return books.filter(
        (b) =>
          b.title.toLowerCase().includes(normalized) ||
          b.author.toLowerCase().includes(normalized) ||
          b.isbn.toLowerCase().includes(normalized)
      );
    },
    [books]
  );

  useEffect(() => {
    startTransition(() => {
      setFilteredBooks(search(query));
    });
  }, [query, search]);

  const onDetected = async (isbn: string) => {
    setError(null);
    const tried: string[] = [];
    const candidates: string[] = [];
    // Generate possible ISBNs (10 / 13)
    if (isbn.length === 13 && isbn.startsWith("978")) {
      candidates.push(isbn);
      candidates.push(isbn.slice(3)); // potential ISBN-10
    } else if (isbn.length === 10) {
      candidates.push(isbn);
      candidates.push("978" + isbn.slice(0, 9) + isbn.slice(9)); // potential 13
    } else {
      candidates.push(isbn);
    }

    let found = false;
    for (const candidate of candidates) {
      tried.push(candidate);
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${candidate}&format=json&jscmd=data`
      );
      const data = await res.json();
      const book = data[`ISBN:${candidate}`] as BookInfo;
      if (book) {
        setBookInfo(book);
        setLastUsedIsbn(candidate);
        setShowBookModal(true);
        found = true;
        break;
      }
    }
    if (!found) {
      setError(`No book found for scanned value. Tried: ${tried.join(", ")}`);
      setShowBookModal(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") || "");
    const author = String(formData.get("author") || "");
    const isbn = String(formData.get("isbn") || "");
    const coverUrl = String(formData.get("coverUrl") || "");

    if (!title || !author || !isbn) {
      setError("Title, author, and ISBN are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await bookRepository.addBook({
        title,
        author,
        isbn,
        coverUrl: coverUrl || undefined,
      });

      setBooks((prev) => [created, ...prev]);
      setFilteredBooks((prev) => [created, ...prev]);
      setShowForm(false);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message ?? "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScannedToDb = async () => {
    if (!bookInfo || !lastUsedIsbn) return;
    setLoading(true);
    try {
      const input = mapBookInfoToCreateBookInput(bookInfo, lastUsedIsbn);
      const created = await bookRepository.addBook(input);

      setBooks((prev) => [created, ...prev]);
      setFilteredBooks((prev) => [created, ...prev]);
      setShowBookModal(false);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message ?? "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Title", "Author", "ISBN"];
    const rows = filteredBooks.map((b) => [b.title, b.author, b.isbn]);
    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "book_collection.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(filteredBooks, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "book_collection.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Books</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner((prev) => !prev)}
            className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {showScanner ? "Hide Scanner" : "Scan Barcode"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Add Manually
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Export JSON
          </button>
        </div>
      </div>

      {showScanner && (
        <div className="mb-4">
          <BarcodeScanner onResult={onDetected} />
        </div>
      )}

      {showBookModal && bookInfo && (
        <BookFoundModal
          handleSaveScannedToDb={handleSaveScannedToDb}
          loading={loading}
          open={
            showBookModal &&
            !!bookInfo &&
            !!bookInfo.title &&
            !bookInfo.title.startsWith("No data found")
          }
          onClose={() => setShowBookModal(false)}
          bookInfo={bookInfo}
        />
      )}

      {showForm && (
        <form onSubmit={handleManualAdd} className="mb-4 p-4 border rounded">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              name="author"
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ISBN
            </label>
            <input
              type="text"
              name="isbn"
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover URL (optional)
            </label>
            <input
              type="text"
              name="coverUrl"
              className="w-full border rounded p-2"
            />
          </div>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Book"}
          </button>
        </form>
      )}

      <input
        type="text"
        placeholder="Search by title, author, or ISBN..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border rounded p-2 mb-4"
      />

      {isPending ? (
        <div>Filtering…</div>
      ) : filteredBooks.length === 0 ? (
        <div>No books found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <div key={book.id} className="border rounded p-2">
              {book.coverUrl && (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  width={120}
                  height={180}
                  className="mb-2 object-cover"
                />
              )}
              <h2 className="font-semibold text-lg">{book.title}</h2>
              <p className="text-sm text-gray-800">{book.author}</p>
              <p className="text-xs text-gray-600 mt-2">ISBN: {book.isbn}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
