import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/auth";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const { pathname } = request.nextUrl;

    // 1. Allow access to login page
    if (pathname === "/login") {
        if (session) {
            try {
                await decrypt(session);
                return NextResponse.redirect(new URL("/", request.url));
            } catch (e) {
                // Token invalid, continue to login
            }
        }
        return NextResponse.next();
    }

    // 2. Allow access to API auth routes
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // 3. Protect all other routes
    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        await decrypt(session);
        return NextResponse.next();
    } catch (e) {
        // If token is expired or invalid, redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("session");
        return response;
    }
}

// Routes to apply middleware to
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
