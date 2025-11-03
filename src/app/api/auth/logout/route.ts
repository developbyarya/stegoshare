import { NextResponse } from "next/server";
import { clearSecretCookie } from "@/lib/auth/secretAccess";

/**
 * POST /api/auth/logout
 * Logout user and clear session and secret cookies
 */
export async function POST() {
    const response = NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
    );

    // Clear session cookie
    response.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    // Clear secret access cookie
    clearSecretCookie(response);

    return response;
}

