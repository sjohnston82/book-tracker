import MyBooksClient from "../../books/MyBooksClient";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MyBooksPage() {
  const rawHeaders = await headers();
  const plainHeaders = new Headers();
  for (const [key, value] of rawHeaders.entries()) {
    plainHeaders.append(key, value);
  }
  const session = await auth.api.getSession({ headers: plainHeaders });
  if (!session?.user) {
    redirect("/signin");
  }
  const booksRaw = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
  });
  const books = booksRaw.map((b) => ({
    ...b,
    coverUrl: b.coverUrl ?? undefined,
  }));
  return <MyBooksClient initialBooks={books} />;
}
