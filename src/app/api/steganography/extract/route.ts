import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { extractMessageFromImage } from "@/lib/steganography";

/**
 * POST /api/steganography/extract
 * Extract a message from an image file
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
        const imageFile = formData.get("image") as File;

        if (!imageFile) {
            return NextResponse.json(
                { error: "Image file is required" },
                { status: 400 }
            );
        }

        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const message = await extractMessageFromImage(imageBuffer);

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        console.error("Steganography extract error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to extract message",
            },
            { status: 500 }
        );
    }
}

