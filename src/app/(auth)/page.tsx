"use client";
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";

export default function AuthHome() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome Back 👋</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => router.push("/add")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          📷 Scan a Book
        </button>
        <button
          onClick={() => router.push("/add-manual")}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          ✍️ Add Manually
        </button>
        <button
          onClick={() => router.push("/books")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          📖 View My Books
        </button>
      </div>
    </main>
  );
}
