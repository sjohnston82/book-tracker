import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { BookInfo } from "@/types/book";
import type { CreateBookInput } from "@/repositories/bookRepository";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function mapBookInfoToCreateBookInput(
  book: BookInfo,
  isbn: string
): CreateBookInput {
  return {
    title: book.title,
    author: book.authors?.map((a) => a.name).join(", ") ?? "Unknown",
    isbn,
    coverUrl:
      book.cover?.large ?? book.cover?.medium ?? book.cover?.small ?? undefined,
  };
}