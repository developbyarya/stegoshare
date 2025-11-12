import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRSAKeyPair, exportPublicKeyToPem, exportPrivateKeyToJwk } from "@/lib/encryption/modern/rsaEncrypt";
import { verifyAuth } from "@/lib/auth/middleware";

/**
 * POST /api/users/:id/regenerateKeys
 * Regenerate RSA key pair for a user
 * Only the user themselves can regenerate their keys
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Verify authentication
        const auth = await verifyAuth(req);
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ error: "Missing user id" }, { status: 400 });
        }

        // Only allow users to regenerate their own keys
        if (auth.userId !== id) {
            return NextResponse.json(
                { error: "You can only regenerate your own keys" },
                { status: 403 }
            );
        }

        // Generate new RSA key pair
        const keyPair = await generateRSAKeyPair();
        const publicKeyPem = await exportPublicKeyToPem(keyPair.publicKey);
        const privateKeyJwk = await exportPrivateKeyToJwk(keyPair.privateKey);

        // Update user's public key in database
        await prisma.user.update({
            where: { id },
            data: { publicKey: publicKeyPem },
        });

        return NextResponse.json(
            {
                message: "Keys regenerated successfully",
                privateKey: privateKeyJwk, // Return new private key to be stored in localStorage
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Key regeneration error:", error);
        return NextResponse.json(
            { error: "Failed to regenerate keys" },
            { status: 500 }
        );
    }
}

