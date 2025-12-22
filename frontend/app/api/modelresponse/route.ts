import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongodb";
import { ModelResponse } from "@/lib/models/modelResponse.model";

export async function GET() {
  try {
    await connectDatabase();
    const modelResponse = await ModelResponse.find();
    
    if (!modelResponse) {
      return NextResponse.json({ message: "Model Responses not found" }, { status: 404 });
    }
    
    return NextResponse.json(modelResponse, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Error fetching model responses" }, { status: 400 });
  }
}
