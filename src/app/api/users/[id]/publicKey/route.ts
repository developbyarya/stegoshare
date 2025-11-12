// src/app/api/users/[id]/publicKey/route.ts
import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(req: NextRequest, ctx: any) {
  const { id } = await ctx.params; 

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { publicKey: true }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ publicKey: user.publicKey }, { status: 200 });
}

export async function POST(req: NextRequest, ctx: any) {
  const { id } = await ctx.params; 

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { publicKey } = await req.json();

  if (!publicKey || typeof publicKey !== "string") {
    return NextResponse.json({ error: "Missing or invalid publicKey" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { publicKey },
    select: { id: true, publicKey: true }
  });

  return NextResponse.json(updated, { status: 200 });
}
