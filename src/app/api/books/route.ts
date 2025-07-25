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

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(books);
}
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  const book = await prisma.book.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (book.count === 0) {
    return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json({ message: "Book deleted successfully" });
}

  