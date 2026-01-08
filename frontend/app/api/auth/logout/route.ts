import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Logout API.
 * Clears the session cookie to log the user out.
 */
export async function POST() {
    (await cookies()).delete("session");
    return NextResponse.json({ success: true, message: "Logged out successfully" });
}
