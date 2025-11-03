import { NextRequest, NextResponse } from "next/server";

const SECRET_COOKIE_NAME = "secret-access";
const SECRET_COOKIE_VALUE = "granted"; // Simple token value
const SECRET_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Secret Access Cookie Management
 * Handles setting, verifying, and clearing the secret access cookie
 */

/**
 * Set the secret access cookie in the response
 * @param response - NextResponse object to set cookie on
 * @returns Response with secret cookie set
 */
export function setSecretCookie(response: NextResponse): NextResponse {
    response.cookies.set(SECRET_COOKIE_NAME, SECRET_COOKIE_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SECRET_COOKIE_MAX_AGE,
        path: "/",
    });
    return response;
}

/**
 * Verify if secret access cookie exists and is valid
 * @param request - NextRequest object to check cookies from
 * @returns true if secret cookie exists and is valid, false otherwise
 */
export function verifySecretCookie(request: NextRequest): boolean {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
        return false;
    }

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const secretCookie = cookies.find((c) => c.startsWith(`${SECRET_COOKIE_NAME}=`));

    if (!secretCookie) {
        return false;
    }

    const cookieValue = secretCookie.split("=")[1];
    return cookieValue === SECRET_COOKIE_VALUE;
}

/**
 * Clear the secret access cookie
 * @param response - NextResponse object to clear cookie on
 * @returns Response with secret cookie cleared
 */
export function clearSecretCookie(response: NextResponse): NextResponse {
    response.cookies.set(SECRET_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });
    return response;
}

