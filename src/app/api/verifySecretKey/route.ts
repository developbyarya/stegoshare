import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { hashFile } from "@/lib/auth/hash";

/**
 * POST /api/verifySecretKey
 * Verify if uploaded file matches secret.key hash
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

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = await hashFile(buffer);
        const expectedHash = process.env.SECRET_KEY_HASH;

        if (!expectedHash) {
            return NextResponse.json(
                { error: "Secret key hash not configured" },
                { status: 500 }
            );
        }

        const isValid = fileHash === expectedHash;

        return NextResponse.json(
            {
                valid: isValid,
                message: isValid
                    ? "Secret key verified successfully"
                    : "Invalid secret key",
            },
            { status: isValid ? 200 : 403 }
        );
    } catch (error) {
        console.error("Secret key verification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

