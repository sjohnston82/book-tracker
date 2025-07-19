"use client";

import {
  useEffect,
  useState,
  useTransition,
  useCallback,
} from "react";
import Image from "next/image";
import BarcodeScanner from "@/components/BarcodeScanner";
import Modal from "@/components/Modal";
import type { BookInfo } from "@/types/book";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl?: string | null;
};

export default function MyBooksClient({
  initialBooks,
}: {
  initialBooks: Book[];
}) {
  const [query, setQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(initialBooks);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    coverUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [manualIsbn, setManualIsbn] = useState("");
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveError, setSaveError] = useState("");
  const [lastUsedIsbn, setLastUsedIsbn] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);
  // Memoized OpenLibrary fetch logic (from /add)
  const fetchBookData = useCallback(async (code: string) => {
    setIsLoading(true);
    const tried = [];
    const isbn = code.replace(/[^0-9Xx]/g, "");
    const candidates: string[] = [];
    if (
      isbn.length === 13 &&
      (isbn.startsWith("978") || isbn.startsWith("979"))
    ) {
      candidates.push(isbn);
    } else if (isbn.length === 10) {
      candidates.push(isbn);
      candidates.push(isbn10to13(isbn));
    } else if (isbn.length === 12 && code.length === 12) {
      candidates.push("978" + isbn.slice(0, 9) + isbn.slice(9));
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
      setBookInfo({
        title: `No data found for code: ${code}\nTried: ${tried.join(", ")}`,
      });
      setLastUsedIsbn("");
    }
    setIsLoading(false);
  }, []);

  function isbn10to13(isbn10: string): string {
    const isbn = "978" + isbn10.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < isbn.length; i++) {
      sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return isbn + check;
  }

  useEffect(() => {
    const q = query.toLowerCase();
    setFilteredBooks(
      books.filter(
        (book) =>
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.isbn.toLowerCase().includes(q)
      )
    );
  }, [query, books]);

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
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "book_collection.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to add book");
      }
      const newBook = await res.json();
      setBooks([newBook, ...books]);
      setForm({ title: "", author: "", isbn: "", coverUrl: "" });
      setShowForm(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to add book");
      } else {
        setError("Failed to add book");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        My Book Collection
      </h1>
      <div className="flex gap-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Book Manually"}
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          onClick={() => setShowScanner((v) => !v)}
        >
          {showScanner ? "Hide Scanner" : "Scan/Lookup by ISBN"}
        </button>
      </div>
      {showScanner && (
        <div className="mb-6">
          <BarcodeScanner onResult={fetchBookData} />
          <div className="mt-4 flex flex-col items-center gap-2">
            <label htmlFor="manual-isbn" className="font-medium text-gray-900">
              Enter ISBN manually (numbers only, dashes not required):
            </label>
            <input
              id="manual-isbn"
              type="text"
              value={manualIsbn}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== manualIsbn) {
                  startTransition(() => setManualIsbn(val));
                }
              }}
              className="border p-2 rounded w-full max-w-xs bg-white text-gray-900 placeholder-gray-500 focus:outline-blue-500"
              placeholder="e.g. 9781234567897"
              autoComplete="off"
            />
            <button
              onClick={() => fetchBookData(manualIsbn.replace(/[^0-9Xx]/g, ""))}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={!manualIsbn || isLoading || isPending}
            >
              {isLoading ? "Searching..." : "Lookup ISBN"}
            </button>
          </div>
          {/* Book found modal */}
          <Modal
            open={
              showBookModal &&
              !!bookInfo &&
              !!bookInfo.title &&
              !bookInfo.title.startsWith("No data found")
            }
            onClose={() => setShowBookModal(false)}
          >
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold mb-2 text-green-700">
                Book Found!
              </h2>
              {bookInfo?.cover?.medium && (
                <Image
                  src={bookInfo.cover.medium}
                  alt={bookInfo.title || "Book cover"}
                  width={120}
                  height={180}
                  className="rounded shadow mb-2"
                />
              )}
              <div className="mb-2 text-center">
                <div className="font-semibold text-lg text-gray-900">
                  {bookInfo?.title}
                </div>
                <div className="text-gray-700">
                  {bookInfo?.authors?.map((a) => a.name).join(", ") ||
                    "Unknown author"}
                </div>
              </div>
              {saveStatus === "error" && (
                <div className="text-red-700 mb-2">{saveError}</div>
              )}
              <div className="flex gap-4 mt-2">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={saveStatus === "saving"}
                  onClick={async () => {
                    setSaveStatus("saving");
                    setSaveError("");
                    try {
                      const res = await fetch("/api/books", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: bookInfo?.title,
                          author:
                            bookInfo?.authors?.map((a) => a.name).join(", ") ||
                            "",
                          isbn: lastUsedIsbn || manualIsbn || "",
                          coverUrl: bookInfo?.cover?.medium || "",
                        }),
                      });
                      if (!res.ok) throw new Error("Failed to save book");
                      const newBook = await res.json();
                      setBooks([newBook, ...books]);
                      setSaveStatus("success");
                      setShowBookModal(false);
                    } catch (e: unknown) {
                      setSaveStatus("error");
                      if (e instanceof Error) {
                        setSaveError(e.message || "Unknown error");
                      } else {
                        setSaveError("Unknown error");
                      }
                    }
                  }}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save"}
                </button>
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setShowBookModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
      {showForm && (
        <form
          onSubmit={handleAddBook}
          className="mb-6 p-4 border rounded bg-white max-w-md shadow"
        >
          <div className="mb-2">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
              className="w-full p-2 border rounded text-gray-900 bg-gray-50"
            />
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Author"
              value={form.author}
              onChange={(e) =>
                setForm((f) => ({ ...f, author: e.target.value }))
              }
              required
              className="w-full p-2 border rounded text-gray-900 bg-gray-50"
            />
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="ISBN"
              value={form.isbn}
              onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
              required
              className="w-full p-2 border rounded text-gray-900 bg-gray-50"
            />
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Cover URL (optional)"
              value={form.coverUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, coverUrl: e.target.value }))
              }
              className="w-full p-2 border rounded text-gray-900 bg-gray-50"
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
        className="mb-2 p-2 border border-gray-400 rounded w-full max-w-md text-gray-900 bg-white"
      />
      <div className="mb-6 flex gap-4">
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export CSV
        </button>
        <button
          onClick={exportToJSON}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export JSON
        </button>
      </div>
      {filteredBooks.length === 0 ? (
        <p className="text-gray-900">No books found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="border rounded p-4 shadow bg-white text-gray-900"
            >
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
