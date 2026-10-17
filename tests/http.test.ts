import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { HttpError, httpRequest } from "@/lib/http";

const payloadSchema = z.object({ value: z.number() });

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("httpRequest", () => {
  it("devuelve datos validados cuando la respuesta es correcta", async () => {
    mockFetch(async () =>
      new Response(JSON.stringify({ value: 42 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await httpRequest("http://api/ok", payloadSchema);
    expect(res).toEqual({ ok: true, data: { value: 42 } });
  });

  it("devuelve error con status cuando la API falla", async () => {
    mockFetch(async () =>
      new Response(JSON.stringify({ error: "ups" }), { status: 500 })
    );

    const res = await httpRequest("http://api/fail", payloadSchema);
    expect(res).toEqual({ ok: false, status: 500, error: "ups" });
  });

  it("lee code y detail del problem document (RFC 7807)", async () => {
    mockFetch(async () =>
      new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Conflict",
          status: 409,
          detail: "La ventana para deshacer expiró",
          code: "UNDO_EXPIRED",
        }),
        { status: 409 }
      )
    );

    const res = await httpRequest("http://api/queue/undo", payloadSchema);
    expect(res).toEqual({
      ok: false,
      status: 409,
      error: "La ventana para deshacer expiró",
      code: "UNDO_EXPIRED",
    });
  });

  it("devuelve error de schema si la respuesta no valida", async () => {
    mockFetch(async () => new Response(JSON.stringify({ value: "no-numero" }), { status: 200 }));

    const res = await httpRequest("http://api/bad-shape", payloadSchema);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("Invalid API response");
  });

  it("acepta cuerpo vacío como null cuando el schema lo permite", async () => {
    mockFetch(async () => new Response(null, { status: 204 }));

    const res = await httpRequest("http://api/empty", z.null());
    expect(res).toEqual({ ok: true, data: null });
  });

  it("convierte errores de red en Result de error", async () => {
    mockFetch(async () => {
      throw new Error("ECONNREFUSED");
    });

    const res = await httpRequest("http://api/down", payloadSchema);
    expect(res).toEqual({ ok: false, error: "ECONNREFUSED" });
  });

  it("aborta por timeout", async () => {
    mockFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    const res = await httpRequest("http://api/slow", payloadSchema, { timeoutMs: 20 });
    expect(res).toEqual({ ok: false, error: "Request timed out" });
  });
});

describe("HttpError", () => {
  it("expone status y nombre", () => {
    const err = new HttpError(404, "no encontrado");
    expect(err.status).toBe(404);
    expect(err.name).toBe("HttpError");
    expect(err instanceof Error).toBe(true);
  });
});
