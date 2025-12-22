import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    message: "Test POST endpoint working",
    method: req.method,
    url: req.url
  }, { status: 200 });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: "Test GET endpoint working",
    method: req.method,
    url: req.url
  }, { status: 200 });
}
