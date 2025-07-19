import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function LandingPage() {
  const rawHeaders = await headers();
  const plainHeaders = new Headers();
  for (const [key, value] of rawHeaders.entries()) {
    plainHeaders.append(key, value);
  }
  const session = await auth.api.getSession({ headers: plainHeaders });
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-bold mb-4">📚 Welcome to Book Tracker</h1>
      <p className="mb-6 text-lg text-gray-700">
        Easily scan and manage your personal book collection on the go.
      </p>
      <div className="flex gap-4 mb-8">
        {!session?.user && (
          <Link
            href="/signin"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        )}
        {!session?.user && (
          <Link
            href="/signup"
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            Sign Up
          </Link>
        )}
        {session?.user && (
          <Link
            href="/books"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            My Books
          </Link>
        )}
      </div>
      <div className="text-gray-500 text-sm">
        No account? Sign up to get started!
      </div>
    </main>
  );
}
