import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashFile } from "@/lib/auth/hash";
import { encryptFileForUser } from "@/lib/fileEncryption";
import { setSecretCookie } from "@/lib/auth/secretAccess";
import { getSecretImageHash, isImageFile } from "@/lib/auth/secretImage";

/**
 * POST /api/upload
 * Upload a file to Supabase storage with encryption
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
        const filename = file.name;

        // Check if uploaded file is the secret image by comparing hash
        // The secret file is an image, and we compare its hash to the secret image hash
        // If it's the secret file, don't upload it - just grant access and redirect
        if (isImageFile(file)) {
            try {
                const fileHash = await hashFile(buffer);
                const secretImageHash = await getSecretImageHash();

                if (fileHash === secretImageHash) {
                    // This is the secret file - don't upload it, just grant access
                    const response = NextResponse.json(
                        {
                            message: "Secret file verified. Access granted.",
                            redirect: "/secret",
                        },
                        { status: 200 }
                    );

                    setSecretCookie(response);
                    return response;
                }
            } catch (error) {
                // If secret image doesn't exist, log but don't fail the upload
                console.error("Error checking secret image hash:", error);
            }
        }

        // Not the secret file - proceed with normal upload
        // Encrypt file using user-specific key
        const encryptedBuffer = await encryptFileForUser(buffer, auth.userId);

        // Upload encrypted file to Supabase Storage
        const supabaseAdmin = getSupabaseAdmin();
        const filePath = `${auth.userId}/${Date.now()}-${filename}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("files")
            .upload(filePath, encryptedBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload file" },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from("files")
            .getPublicUrl(filePath);

        // Save file record to database
        const fileRecord = await prisma.file.create({
            data: {
                userId: auth.userId,
                filename,
                url: urlData.publicUrl,
            },
        });

        // Return success response for normal file upload
        return NextResponse.json(
            {
                message: "File uploaded successfully",
                fileId: fileRecord.id,
                url: urlData.publicUrl,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

