import { NextRequest, NextResponse } from "next/server";
import {
  listConfigKeys,
  setConfigKey,
  unsetConfigKey,
} from "@turkey/config";

export async function GET() {
  const keys = listConfigKeys();
  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const key = body?.key as string | undefined;
  const value = body?.value as string | undefined;
  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "Missing key or value" },
      { status: 400 }
    );
  }
  setConfigKey(key, value);
  const keys = listConfigKeys();
  return NextResponse.json({ keys });
}

export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  unsetConfigKey(key);
  const keys = listConfigKeys();
  return NextResponse.json({ keys });
}
