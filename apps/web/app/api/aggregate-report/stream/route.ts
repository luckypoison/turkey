import { NextRequest } from "next/server";
import { runAggregateReport } from "@turkey/aggregate-agent";

function toSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const inputs = body?.inputs as Array<{ type: string; value: string }> | undefined;
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return new Response(toSse("error", { message: "Missing or empty inputs array." }), {
      status: 400,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const allowed = ["conversation", "image", "url"];
  const typed = inputs.filter((i) => i && allowed.includes(i.type) && typeof i.value === "string") as Array<{
    type: "conversation" | "image" | "url";
    value: string;
  }>;
  if (typed.length === 0) {
    return new Response(toSse("error", { message: "No valid inputs." }), {
      status: 400,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const push = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(toSse(event, data)));
      };

      (async () => {
        try {
          push("status", { message: "Starting aggregate agent..." });
          const result = await runAggregateReport(typed, {
            onProgress: (evt) => {
              push("progress", evt);
            },
          });
          push("report", { report: result.report });
          push("done", { ok: true });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          push("error", { message });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

