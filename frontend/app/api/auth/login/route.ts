import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Login API.
 * Authenticates the user against environment variables (simple auth)
 * and sets a secure HTTP-only session cookie.
 */
export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        // Simple environment-based authentication
        const adminUser = process.env.ADMIN_USERNAME || "admin";
        const adminPass = process.env.ADMIN_PASSWORD || "admin123";

        if (username === adminUser && password === adminPass) {
            // Create session with 24-hour expiration
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            const session = await encrypt({
                user: { name: "Administrator", username: adminUser },
                expires
            });

            // Set secure session cookie
            (await cookies()).set("session", session, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            });

            return NextResponse.json({ success: true, message: "Logged in successfully" });
        }

        return NextResponse.json(
            { success: false, message: "Invalid username or password" },
            { status: 401 }
        );
    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
