import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/messages/:id -> fetch a single message with basic sender/recipient info
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const rows = await prisma.$queryRaw<any[]>`
      SELECT m.id,
             m.sender_id AS "senderId",
             m.recipient_id AS "recipientId",
             m.ciphertext,
             m.encrypted_key AS "encryptedKey",
             m.created_at AS "createdAt",
             json_build_object('id', s.id, 'username', s.username) AS sender,
             json_build_object('id', r.id, 'username', r.username) AS recipient
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.recipient_id
      WHERE m.id = ${id}
      LIMIT 1
    `;

    const msg = rows?.[0] ?? null;
    if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    return NextResponse.json(msg, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });
  }
}


