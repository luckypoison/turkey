import { NextRequest, NextResponse } from "next/server";
import { runAggregateReport } from "@turkey/aggregate-agent";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const body = await request.json();
  const inputs = body?.inputs as Array<{ type: string; value: string }> | undefined;
  if (!Array.isArray(inputs) || inputs.length === 0) {
    console.log("[api/aggregate-report] missing or empty inputs");
    return NextResponse.json(
      { error: "Missing or empty inputs array. Each item: { type: 'conversation' | 'image' | 'url', value: string }" },
      { status: 400 }
    );
  }
  const valid = inputs.every(
    (i) => i && typeof i.type === "string" && typeof i.value === "string"
  );
  if (!valid) {
    console.log("[api/aggregate-report] invalid input shape");
    return NextResponse.json(
      { error: "Each input must have type and value (strings)." },
      { status: 400 }
    );
  }
  const allowed = ["conversation", "image", "url"];
  const typed = inputs.filter((i) => allowed.includes(i.type)) as Array<{
    type: "conversation" | "image" | "url";
    value: string;
  }>;
  if (typed.length === 0) {
    console.log("[api/aggregate-report] no allowed types in inputs");
    return NextResponse.json(
      { error: "At least one input must have type: conversation, image, or url." },
      { status: 400 }
    );
  }
  console.log("[api/aggregate-report] start, inputs types:", typed.map((i) => i.type));
  try {
    const result = await runAggregateReport(typed);
    console.log(
      "[api/aggregate-report] done in",
      Date.now() - startedAt,
      "ms, report length:",
      result.report?.length ?? 0
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/aggregate-report] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
