import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashFile } from "@/lib/auth/hash";

/**
 * POST /api/upload
 * Upload a file to Supabase storage
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

        // Upload to Supabase Storage
        const supabaseAdmin = getSupabaseAdmin();
        const filePath = `${auth.userId}/${Date.now()}-${filename}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("files")
            .upload(filePath, buffer, {
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

        // Check if uploaded file is secret.key
        if (filename === "secret.key") {
            const fileHash = await hashFile(buffer);
            const expectedHash = process.env.SECRET_KEY_HASH;

            if (expectedHash && fileHash === expectedHash) {
                // Valid secret key - return redirect flag
                return NextResponse.json(
                    {
                        message: "File uploaded successfully",
                        fileId: fileRecord.id,
                        redirect: "/secret",
                    },
                    { status: 200 }
                );
            }
        }

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

