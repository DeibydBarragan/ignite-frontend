import { z } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number; code?: string };

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

let apiUserId: string | null = null;
let apiDevMode: boolean = false;

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function setApiUserId(id: string | null): void {
  apiUserId = id;
}

export function setApiDevMode(enabled: boolean): void {
  apiDevMode = enabled;
}

export async function httpRequest<T>(
  url: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {}
): Promise<Result<T>> {
  const { timeoutMs = 8000, ...fetchOpts } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(fetchOpts.headers);
    const isFormData =
      typeof FormData !== "undefined" && fetchOpts.body instanceof FormData;
    if (!headers.has("Content-Type") && !isFormData) {
      headers.set("Content-Type", "application/json");
    }
    const method = (fetchOpts.method ?? "GET").toUpperCase();
    if (apiUserId && MUTATION_METHODS.has(method)) {
      headers.set("X-User-Discord-Id", apiUserId);
    }
    if (apiDevMode && MUTATION_METHODS.has(method)) {
      headers.set("X-Dev-Mode", "true");
    }

    const res = await fetch(url, { ...fetchOpts, headers, signal: controller.signal });
    if (!res.ok) {
      // El bot responde errores como RFC 7807 (problem+json) con `code`/`detail`;
      // se mantiene `error` para el formato legacy.
      const errBody = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        detail?: string;
        title?: string;
      };
      const message = errBody.detail ?? errBody.error ?? errBody.title ?? `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: message, code: errBody.code };
    }

    // 204 / vacío: validar contra schema de void/nullable en el caller.
    const text = await res.text();
    const json: unknown = text.length === 0 ? null : (JSON.parse(text) as unknown);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: `Invalid API response: ${parsed.error.message}` };
    }
    return { ok: true, data: parsed.data };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Request timed out" };
    }
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
