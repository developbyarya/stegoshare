import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/hash";
import { generateSessionToken } from "@/lib/auth/session";
import { decryptUserData } from "@/lib/auth/userDataEncryption";

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

        // Generate session token
        const token = await generateSessionToken({
            userId: user.id,
            username: user.username,
        });

        // Create response with cookie
        const response = NextResponse.json(
            {
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username,
                },
            },
            { status: 200 }
        );

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

