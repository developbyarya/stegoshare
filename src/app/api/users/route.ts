import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users?search=<q>
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("search") || "").trim();

        if (!q) {
            return NextResponse.json([], { status: 200 });
        }

        // Basic search by username (case-insensitive) or direct id match/prefix
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: q, mode: "insensitive" } },
                    { id: { startsWith: q } },
                ],
            },
            select: { id: true, username: true },
            take: 20,
            orderBy: { username: "asc" },
        });

        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "User search failed" }, { status: 500 });
    }
}


