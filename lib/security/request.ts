import { LocalApiError } from "@/lib/local/errors";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  return candidate;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    const requestOrigin = new URL(request.url).origin;
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(
      /\/+$/,
      "",
    );
    const allowedOrigins = new Set([requestOrigin]);

    if (configuredOrigin) allowedOrigins.add(configuredOrigin);

    if (!allowedOrigins.has(origin.replace(/\/+$/, ""))) {
      throw new LocalApiError("Origen no permitido.", 403, "INVALID_ORIGIN");
    }
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new LocalApiError("Origen no permitido.", 403, "INVALID_ORIGIN");
  }
}
