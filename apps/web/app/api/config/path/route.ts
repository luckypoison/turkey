import { NextResponse } from "next/server";
import { getConfigPath } from "@turkey/config";

export async function GET() {
  const path = getConfigPath();
  return NextResponse.json({ path });
}
