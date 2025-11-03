import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { encryptFileToBuffer } from "@/lib/fileEncryption";

/**
 * POST /api/encrypt-file
 * Encrypt a file with a user-provided key
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const key = formData.get("key") as string;

        if (!file || !key) {
            return NextResponse.json(
                { error: "File and encryption key are required" },
                { status: 400 }
            );
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const encrypted = await encryptFileToBuffer(fileBuffer, key);

        return new NextResponse(encrypted, {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="encrypted_${file.name}"`,
            },
        });
    } catch (error) {
        console.error("File encryption error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to encrypt file",
            },
            { status: 500 }
        );
    }
}

