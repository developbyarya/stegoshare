import { SignJWT, jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

export interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
}

/**
 * Generate a session token (JWT implementation compatible with Edge runtime)
 * @param payload - Session data
 * @returns Signed token
 */
export async function generateSessionToken(payload: SessionPayload): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);
    console.log("Generating token with JWT_SECRET:", JWT_SECRET ? "Set (length: " + JWT_SECRET.length + ")" : "Not set");

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    console.log("Token generated successfully");
    return token;
}

/**
 * Verify and decode a session token (Edge runtime compatible)
 * @param token - Session token
 * @returns Decoded payload or null if invalid
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        console.log("Verifying token with JWT_SECRET:", JWT_SECRET ? "Set (length: " + JWT_SECRET.length + ")" : "Not set");

        const { payload: decoded } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
        });


        // Verify the payload has required fields
        if (decoded.userId && decoded.username) {
            return {
                userId: decoded.userId as string,
                username: decoded.username as string,
            };
        }

        return null;
    } catch (error) {
        console.error("Token verification failed:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error name:", error.name);
        }
        return null;
    }
}

/**
 * Extract session token from request headers
 * @param cookieHeader - Cookie header string
 * @returns Token or null
 */
export function extractTokenFromCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("session="));

    if (!sessionCookie) return null;

    // Extract token value and URL decode it
    // Handle case where there might be multiple "=" in the value
    const tokenValue = sessionCookie.substring("session=".length);
    const token = decodeURIComponent(tokenValue);
    console.log("Extracted token (decoded):", token);
    return token;
}

