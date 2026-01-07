import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-safe middleware
 * - Protects UI routes
 * - Allows ALL API routes
 * - No crypto / node usage
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1️⃣ Always allow API routes (Early exit)
    if (pathname.startsWith("/api") || pathname.includes("/api/")) {
        return NextResponse.next();
    }

    // 2️⃣ Always allow Next internals & public files
    if (
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next();
    }

    // 3️⃣ Allow login page
    if (pathname === "/login") {
        return NextResponse.next();
    }

    // 4️⃣ Simple UI protection (cookie presence ONLY)
    const session = request.cookies.get("session")?.value;

    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 5️⃣ Allow request to continue
    return NextResponse.next();
}

/**
 * Apply middleware ONLY to UI routes
 * (Exclude APIs explicitly)
 */
export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
