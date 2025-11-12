import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sentBy = searchParams.get("sentBy");
    const receivedBy = searchParams.get("receivedBy");
    const user = searchParams.get("user");

    let whereClause = {};

    if (sentBy) {
      whereClause = { senderId: sentBy };
    } else if (receivedBy) {
      whereClause = { recipientId: receivedBy };
    } else if (user) {
      whereClause = {
        OR: [{ senderId: user }, { recipientId: user }],
      };
    } else {
      return NextResponse.json(
        { error: "Missing query. Use ?sentBy=, ?receivedBy=, or ?user=" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        ciphertext: true,
        encryptedKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json(messages, { status: 200 });

  } catch (error) {
    console.error("GET /messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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



