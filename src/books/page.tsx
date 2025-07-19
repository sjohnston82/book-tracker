import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import MyBooksClient from "./MyBooksClient";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function MyBooksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/");
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
  });

  return <MyBooksClient initialBooks={books} />;
}
