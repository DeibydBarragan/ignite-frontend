import { NextRequest, NextResponse } from "next/server";
import { getMusicBaseUrl, getServerSecret } from "@/lib/server/upstream";

async function proxy(req: NextRequest, path: string[]) {
  let base: string;
  let secret: string;
  try {
    base = await getMusicBaseUrl();
    secret = getServerSecret();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const search = new URL(req.url).search ?? "";
  const target = `${base}/api/v1/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
  };
  const incomingContentType = req.headers.get("content-type");
  if (incomingContentType) {
    headers["Content-Type"] = incomingContentType;
  }
  // Identidad del usuario autenticado (la exige el bot en POST/PUT/PATCH/DELETE).
  const discordUserId = req.headers.get("x-user-discord-id");
  if (discordUserId) {
    headers["X-User-Discord-Id"] = discordUserId;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
    redirect: "manual",
    // Cierra el upstream (p. ej. el stream SSE) cuando el cliente se desconecta.
    signal: req.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer().catch(() => null);
    if (buf && buf.byteLength > 0) {
      init.body = Buffer.from(buf);
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json({ error: "Music bot unreachable" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    if (!upstream.body) {
      return new NextResponse(null, { status: upstream.status });
    }
    // Passthrough sin buffering: el server requiere stream, no arrayBuffer.
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }
  if (contentType.includes("application/json")) {
    const data: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buf, {
    status: upstream.status,
    headers: { "Content-Type": contentType || "application/octet-stream" },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

async function resolvePath(ctx: Ctx): Promise<string[]> {
  const p = await ctx.params;
  return p.path ?? [];
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, await resolvePath(ctx));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, await resolvePath(ctx));
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, await resolvePath(ctx));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, await resolvePath(ctx));
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, await resolvePath(ctx));
}
