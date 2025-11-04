import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/:id/publicKey
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id }, select: { publicKey: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ publicKey: user.publicKey || null }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch public key" }, { status: 500 });
  }
}

// POST /api/users/:id/publicKey
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { publicKey } = await req.json();
    if (!publicKey || typeof publicKey !== "string") {
      return NextResponse.json({ error: "Missing publicKey" }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id }, data: { publicKey } });
    return NextResponse.json({ id: updated.id, publicKey: publicKey }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to set public key" }, { status: 500 });
  }
}


