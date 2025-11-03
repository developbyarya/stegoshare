import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { decryptFileForUser } from "@/lib/fileEncryption";

/**
 * GET /api/download/[fileId]
 * Download a file
 * Decrypts if file belongs to user, returns encrypted if not
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { fileId } = await params;

        // Fetch file record
        const fileRecord = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!fileRecord) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Get file from Supabase Storage
        const supabaseAdmin = getSupabaseAdmin();
        const filePath = fileRecord.url.split("/").slice(-2).join("/"); // Extract path from URL

        const { data: fileData, error: downloadError } =
            await supabaseAdmin.storage.from("files").download(filePath);

        if (downloadError || !fileData) {
            console.error("Supabase download error:", downloadError);
            return NextResponse.json(
                { error: "Failed to download file" },
                { status: 500 }
            );
        }

        const encryptedBuffer = Buffer.from(await fileData.arrayBuffer());

        // If file belongs to user, decrypt it
        const isOwner = fileRecord.userId === auth.userId;
        let fileBuffer: Buffer;

        if (isOwner) {
            // Decrypt for owner
            try {
                fileBuffer = await decryptFileForUser(
                    encryptedBuffer,
                    auth.userId
                );
            } catch (decryptError) {
                console.error("Decryption error:", decryptError);
                return NextResponse.json(
                    { error: "Failed to decrypt file" },
                    { status: 500 }
                );
            }
        } else {
            // Return encrypted version for non-owners
            fileBuffer = encryptedBuffer;
        }

        // Return file with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileRecord.filename}"`,
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

