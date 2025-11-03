import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { hideMessageInImage } from "@/lib/steganography";

/**
 * POST /api/steganography/hide
 * Hide a message in an image file
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
        const message = formData.get("message") as string;

        if (!imageFile || !message) {
            return NextResponse.json(
                { error: "Image file and message are required" },
                { status: 400 }
            );
        }

        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const result = await hideMessageInImage(imageBuffer, message);

        return new NextResponse(result, {
            headers: {
                "Content-Type": imageFile.type,
                "Content-Disposition": `attachment; filename="hidden_${imageFile.name}"`,
            },
        });
    } catch (error) {
        console.error("Steganography hide error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to hide message",
            },
            { status: 500 }
        );
    }
}

