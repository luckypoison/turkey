import { NextResponse } from "next/server";
import { aggregateContext, type ContextFetcher } from "@turkey/core";

const staticFetcher: ContextFetcher = {
  async fetch() {
    return [
      {
        id: "1",
        type: "issue",
        title: "Example: user login flow improvements",
        body: "Support remember-me and add security checks.",
        createdAt: new Date().toISOString(),
      },
    ];
  },
};

export async function GET() {
  const context = await aggregateContext([staticFetcher], {});
  return NextResponse.json(context);
}
