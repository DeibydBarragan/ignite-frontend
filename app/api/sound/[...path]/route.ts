import { NextRequest, NextResponse } from "next/server";
import { getSoundBaseUrl, getServerSecret } from "@/lib/server/upstream";

async function proxy(req: NextRequest, path: string[]) {
  let base: string;
  try {
    base = getSoundBaseUrl();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server misconfigured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // El bot de sonido no exige auth, pero si hay secreto configurado lo inyectamos.
  let secret: string | null = null;
  try {
    secret = getServerSecret();
  } catch {
    secret = null;
  }

  const search = new URL(req.url).search ?? "";
  const target = `${base}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers: Record<string, string> = {};
  if (secret) {
    headers["Authorization"] = `Bearer ${secret}`;
  }
  const incomingContentType = req.headers.get("content-type");
  if (incomingContentType) {
    headers["Content-Type"] = incomingContentType;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
    redirect: "manual",
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
    return NextResponse.json({ error: "Sound bot unreachable" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  // Preview TTS devuelve audio/* — passthrough binario.
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
