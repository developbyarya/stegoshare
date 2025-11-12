import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/hash";
import { encryptUserData } from "@/lib/auth/userDataEncryption";
import { generateRSAKeyPair, exportPublicKeyToPem, exportPrivateKeyToJwk } from "@/lib/encryption/modern/rsaEncrypt";
import { aesEncrypt } from "@/lib/encryption/modern/aesEncrypt";

/**
 * POST /api/auth/register
 * Register a new user with encrypted data storage
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

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists (using plain username for lookup)
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Encrypt user data using password as key
        const encryptedData = encryptUserData(
            { username, passwordHash },
            password
        );

        // Generate RSA key pair for message encryption
        const keyPair = await generateRSAKeyPair();
        const publicKeyPem = await exportPublicKeyToPem(keyPair.publicKey);
        const privateKeyJwk = await exportPrivateKeyToJwk(keyPair.privateKey);

        // Encrypt private key with user's password for database storage
        const privateKeyJson = JSON.stringify(privateKeyJwk);
        const encryptedPrivateKey = aesEncrypt(privateKeyJson, password);

        // Create user with both plain and encrypted data
        // Plain data kept for backward compatibility and login lookup
        const user = await prisma.user.create({
            data: {
                username, // Plain username for lookup
                passwordHash, // Plain hash for verification
                encryptedUsername: encryptedData.encryptedUsername,
                encryptedPasswordHash: encryptedData.encryptedPasswordHash,
                publicKey: publicKeyPem, // Store public key for receiving encrypted messages
                encryptedPrivateKey: encryptedPrivateKey, // Store encrypted private key for retrieval on login
            },
        });

        return NextResponse.json(
            {
                message: "User registered successfully",
                userId: user.id,
                privateKey: privateKeyJwk // Return private key to be stored in localStorage
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

