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
    const cookieHeader = request.headers.get("cookie");
    const token = extractTokenFromCookie(cookieHeader);

    if (!token) {
        return null;
    }

    const payload = verifySessionToken(token);
    return payload;
}

