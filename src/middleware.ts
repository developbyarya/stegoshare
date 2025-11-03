import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { verifySecretCookie } from "@/lib/auth/secretAccess";

/**
 * Next.js Middleware for route protection
 * - Protects all routes except /login, /register, and /api/auth/*
 * - Checks for secret cookie on /secret/* routes
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public access to auth pages and auth API routes
    if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/api/auth/")
    ) {
        return NextResponse.next();
    }

    // Check authentication for all other routes
    const auth = await verifyAuth(request);

    if (!auth) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check secret access for /secret/* routes
    if (pathname.startsWith("/secret")) {
        const hasSecretAccess = verifySecretCookie(request);

        if (!hasSecretAccess) {
            // Return 404 if trying to access secret pages without access
            return new NextResponse(null, { status: 404 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

