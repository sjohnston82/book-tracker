"use client";
import { BookInfo } from "@/types/book";
import Image from "next/image";
import React from "react";

export default function BookFoundModal({
  open,
  onClose,
  bookInfo,
  handleSaveScannedToDb,
  loading
}: {
  open: boolean;
  onClose: () => void;
  bookInfo: BookInfo;
  handleSaveScannedToDb: () => Promise<void>;
  loading: boolean;
}) {
  if (!open) return null;

  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2">{bookInfo.title}</h2>
          <p className="text-gray-700 mb-2">
            {bookInfo.authors?.map((a) => a.name).join(", ") ?? "Unknown"}
          </p>
          {bookInfo.cover?.large && (
            <Image
              src={bookInfo.cover.large}
              alt={bookInfo.title}
              width={200}
              height={280}
              className="mb-2 object-cover"
            />
          )}
          <button
            onClick={handleSaveScannedToDb}
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save to DB"}
          </button>
        </div>
      </div>
    </div>
  );
}
