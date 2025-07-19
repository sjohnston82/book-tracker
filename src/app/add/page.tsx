"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import BarcodeScanner from "@/components/BarcodeScanner";
import Image from "next/image";

interface Author {
  name: string;
}

interface Cover {
  medium: string;
  large?: string;
  small?: string;
}


interface BookInfo {
  title: string;
  authors?: Author[];
  cover?: Cover;
}


  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [manualIsbn, setManualIsbn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"success"|"error">("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [lastUsedIsbn, setLastUsedIsbn] = useState<string>("");

  // Memoize fetchBookData callback so BarcodeScanner does not remount on every render
  const fetchBookData = useCallback(async (code: string) => {
    setIsLoading(true);
    console.log("Scanned code:", code);
    let tried = [];
    let isbn = code.replace(/[^0-9Xx]/g, "");
    let candidates: string[] = [];
    if (isbn.length === 13 && (isbn.startsWith("978") || isbn.startsWith("979"))) {
      candidates.push(isbn);
    } else if (isbn.length === 10) {
      candidates.push(isbn);
      candidates.push(isbn10to13(isbn));
    } else if (isbn.length === 12 && code.length === 12) {
      // UPC-A, try as-is and with 978 prefix
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
        found = true;
        break;
      }
    }
    if (!found) {
      setBookInfo({ title: `No data found for code: ${code}\nTried: ${tried.join(", ")}` });
      setLastUsedIsbn("");
    }
    setIsLoading(false);
    // optionally: POST to your own /api/books route
  }, []);

  // Helper to convert ISBN-10 to ISBN-13
  function isbn10to13(isbn10: string): string {
    let isbn = '978' + isbn10.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < isbn.length; i++) {
      sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return isbn + check;
  }



  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Scan a Book</h1>
      {useMemo(() => <BarcodeScanner onResult={fetchBookData} />, [fetchBookData])}
      <div className="mt-4 flex flex-col items-center gap-2">
        <label htmlFor="manual-isbn" className="font-medium">
          Enter ISBN manually (numbers only, dashes not required):
        </label>
        {useMemo(() => (
          <input
            id="manual-isbn"
            type="text"
            value={manualIsbn}
            onChange={e => {
              const val = e.target.value;
              if (val !== manualIsbn) {
                startTransition(() => setManualIsbn(val));
              }
            }}
            className="border p-2 rounded w-full max-w-xs bg-white text-black placeholder-gray-500 focus:outline-blue-500"
            placeholder="e.g. 9781234567897"
            autoComplete="off"
          />
        ), [manualIsbn])}
        <button
          onClick={() => fetchBookData(manualIsbn.replace(/[^0-9Xx]/g, ""))}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!manualIsbn || isLoading || isPending}
        >
          {isLoading ? "Searching..." : "Lookup ISBN"}
        </button>
      </div>
      {bookInfo && (
        <div className="mt-4 p-4 border rounded bg-gray-50 text-black">
          <h2 className="text-lg font-semibold mb-2">{bookInfo.title || 'No title found'}</h2>
          {bookInfo.cover?.medium && (
            <Image
              src={bookInfo.cover.medium}
              alt={bookInfo.title || "Book cover"}
              width={200}
              height={300}
              className="rounded shadow mb-2"
            />
          )}
          <div className="mb-2">
            <strong>Authors:</strong> {bookInfo.authors?.map((a) => a.name).join(", ") || "Unknown author"}
          </div>
          <div className="mb-2">
            <strong>Raw Data:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1 text-black">{JSON.stringify(bookInfo, null, 2)}</pre>
          </div>
          {saveStatus === "success" ? (
            <div className="mt-2 text-green-700 font-semibold">
              Book saved! <Link href="/books" className="underline text-blue-700">View My Books</Link>
            </div>
          ) : (
            <button
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={saveStatus === "saving"}
              onClick={async () => {
                setSaveStatus("saving");
                setSaveError("");
                try {
                  const res = await fetch("/api/books", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: bookInfo.title,
                      author: bookInfo.authors?.map(a => a.name).join(", ") || "",
                      isbn: lastUsedIsbn || manualIsbn || "",
                      coverUrl: bookInfo.cover?.medium || "",
                    }),
                  });
                  if (!res.ok) throw new Error("Failed to save book");
                  setSaveStatus("success");
                } catch (e: any) {
                  setSaveStatus("error");
                  setSaveError(e.message || "Unknown error");
                }
              }}
            >
              {saveStatus === "saving" ? "Saving..." : "Save to My Books"}
            </button>
          )}
          {saveStatus === "error" && (
            <div className="mt-2 text-red-700">Error: {saveError}</div>
          )}
        </div>
      )}
    </div>
  );
}
