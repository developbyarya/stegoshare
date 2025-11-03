import { NextRequest } from "next/server";
import { verifySessionToken, extractTokenFromCookie } from "./session";

/**
 * Middleware to verify user session
 * Returns user payload if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<{
    userId: string;
    username: string;
} | null> {
    // Try Next.js built-in cookie parsing first (if available)
    let token: string | null = request.cookies.get("session")?.value || null;

    // Fallback to manual cookie parsing if cookies.get doesn't work
    if (!token) {
        const cookieHeader = request.headers.get("cookie");
        token = extractTokenFromCookie(cookieHeader);
    }

    if (!token) {
        console.log("No session token found in cookies");
        return null;
    }

    console.log("Token from cookie:", token);
    const payload = await verifySessionToken(token);
    console.log("Payload:", payload);
    return payload;
}

