import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, author, isbn, coverUrl } = await req.json();

  const book = await prisma.book.create({
    data: {
      title,
      author,
      isbn,
      coverUrl,
      userId: session.user.id,
    },
  });

  return NextResponse.json(book);
}
