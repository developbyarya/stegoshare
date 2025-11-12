import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const sentBy = searchParams.get("sentBy");

        if (!userId && !sentBy) {
            return NextResponse.json({ error: "Missing userId or sentBy" }, { status: 400 });
        }

        if (userId && sentBy) {
            return NextResponse.json({ error: "Provide only userId or sentBy, not both" }, { status: 400 });
        }

        if (userId) {
            const messages = await prisma.$queryRaw<any[]>`
        SELECT m.id,
               m.sender_id AS "senderId",
               m.recipient_id AS "recipientId",
               m.ciphertext,
               m.encrypted_key AS "encryptedKey",
               m.created_at AS "createdAt",
               json_build_object('id', s.id, 'username', s.username) AS sender
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        WHERE m.recipient_id = ${userId}
        ORDER BY m.created_at DESC
      `;
            return NextResponse.json(messages, { status: 200 });
        }

        if (sentBy) {
            const messages = await prisma.$queryRaw<any[]>`
        SELECT m.id,
               m.sender_id AS "senderId",
               m.recipient_id AS "recipientId",
               m.ciphertext,
               m.encrypted_key AS "encryptedKey",
               m.created_at AS "createdAt",
               json_build_object('id', s.id, 'username', s.username) AS sender
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        WHERE m.sender_id = ${sentBy}
        ORDER BY m.created_at DESC
      `;
            return NextResponse.json(messages, { status: 200 });
        }

        return NextResponse.json([], { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { senderId, recipientId, ciphertext, encryptedKey } = body ?? {};
        console.log("Check body : ", body);

        if (!senderId || !recipientId || !ciphertext || !encryptedKey) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Ensure both users exist
        const [sender, recipient] = await Promise.all([
            prisma.user.findUnique({ where: { id: senderId } }),
            prisma.user.findUnique({ where: { id: recipientId } }),
        ]);

        if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
        if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

        // Use Prisma create method to ensure all defaults (like id and createdAt) are handled properly
        const saved = await prisma.message.create({
            data: {
                senderId,
                recipientId,
                ciphertext,
                encryptedKey,
            },
            select: {
                id: true,
                senderId: true,
                recipientId: true,
                ciphertext: true,
                encryptedKey: true,
                createdAt: true,
            },
        });

        return NextResponse.json(saved, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}


