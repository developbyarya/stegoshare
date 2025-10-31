import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

export interface SessionPayload {
    userId: string;
    username: string;
}

/**
 * Generate a session token (JWT-like implementation)
 * @param payload - Session data
 * @returns Signed token
 */
export function generateSessionToken(payload: SessionPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
}

/**
 * Verify and decode a session token
 * @param token - Session token
 * @returns Decoded payload or null if invalid
 */
export function verifySessionToken(token: string): SessionPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
        return decoded;
    } catch (error) {
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

    return sessionCookie.split("=")[1];
}

