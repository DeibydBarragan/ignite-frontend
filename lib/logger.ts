type Level = "debug" | "info" | "warn" | "error";

function formatArgs(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (a instanceof Error) {
      // Incluye props extra propias (p.ej. code/details/hint de PostgrestError).
      return { name: a.name, message: a.message, ...Object.fromEntries(Object.entries(a)), stack: a.stack };
    }
    if (a && typeof a === "object") {
      const obj = a as Record<string, unknown>;
      if ("message" in obj || "code" in obj || "details" in obj || "hint" in obj) {
        return {
          message: obj.message,
          code: obj.code,
          details: obj.details,
          hint: obj.hint,
          ...obj,
        };
      }
    }
    return a;
  });
}

function log(level: Level, ...args: unknown[]) {
  const prefix = `[ignite:${level}]`;
  if (level === "error") {
    console.error(prefix, ...formatArgs(args));
  } else if (level === "warn") {
    console.warn(prefix, ...formatArgs(args));
  } else if (level === "debug") {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(prefix, ...formatArgs(args));
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(prefix, ...formatArgs(args));
  }
}

export const logger = {
  debug: (...args: unknown[]) => log("debug", ...args),
  info: (...args: unknown[]) => log("info", ...args),
  warn: (...args: unknown[]) => log("warn", ...args),
  error: (...args: unknown[]) => log("error", ...args),
};
