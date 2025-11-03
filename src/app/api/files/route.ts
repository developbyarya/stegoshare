import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/files
 * Get all files with user information
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch all files with user information
        const files = await prisma.file.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: "desc",
            },
        });

        return NextResponse.json(
            {
                files: files.map((file) => ({
                    id: file.id,
                    filename: file.filename,
                    url: file.url,
                    uploadedAt: file.uploadedAt,
                    userId: file.userId,
                    uploader: file.user.username,
                })),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Files fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

