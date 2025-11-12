import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/hash";
import { generateSessionToken } from "@/lib/auth/session";
import { decryptUserData } from "@/lib/auth/userDataEncryption";
import { aesDecrypt } from "@/lib/encryption/modern/aesEncrypt";

/**
 * POST /api/auth/login
 * Login user and create session
 * Verifies encrypted user data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        // Find user (using plain username for lookup)
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                passwordHash: true,
                encryptedUsername: true,
                encryptedPasswordHash: true,
                publicKey: true,
                encryptedPrivateKey: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Verify password using plain hash
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }

        // If encrypted data exists, verify it can be decrypted
        if (user.encryptedUsername && user.encryptedPasswordHash) {
            try {
                const decryptedData = decryptUserData(
                    {
                        encryptedUsername: user.encryptedUsername,
                        encryptedPasswordHash: user.encryptedPasswordHash,
                    },
                    password
                );

                // Verify decrypted data matches
                if (
                    decryptedData.username !== username ||
                    decryptedData.passwordHash !== user.passwordHash
                ) {
                    console.warn(
                        "Encrypted data verification failed for user:",
                        user.id
                    );
                }
            } catch (decryptError) {
                console.error("Failed to decrypt user data:", decryptError);
                // Continue with login even if decryption fails (backward compatibility)
            }
        }

        // Decrypt private key if available (for users who registered after this feature was added)
        let decryptedPrivateKey: JsonWebKey | null = null;
        if (user.encryptedPrivateKey) {
            try {
                const privateKeyJson = aesDecrypt(user.encryptedPrivateKey, password);
                decryptedPrivateKey = JSON.parse(privateKeyJson);
            } catch (decryptError) {
                console.error("Failed to decrypt private key for user:", user.id, decryptError);
                // Don't fail login if private key decryption fails - user might have changed password
                // or there's a data corruption issue
            }
        }

        // Generate session token
        const token = await generateSessionToken({
            userId: user.id,
            username: user.username,
        });

        // Create response with cookie
        const responseData: any = {
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
            },
        };

        // Include private key in response if successfully decrypted
        if (decryptedPrivateKey) {
            responseData.privateKey = decryptedPrivateKey;
        }

        const response = NextResponse.json(responseData, { status: 200 });

        // Set session cookie
        response.cookies.set("session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

