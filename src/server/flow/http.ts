import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export type ApiResponse = ServerResponse;

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function sendJson(res: ApiResponse, statusCode: number, payload: Record<string, unknown>) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function assertMethod(req: ApiRequest, method: string) {
  if (req.method !== method) {
    throw new ApiError(405, `Method ${req.method ?? "UNKNOWN"} not allowed`);
  }
}

export async function parseJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const raw = await readRawBody(req);
  if (!raw) return {};
  return JSON.parse(raw);
}

export async function parseFormBody(req: ApiRequest): Promise<Record<string, string>> {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      return Object.fromEntries(new URLSearchParams(req.body));
    }
    if (typeof req.body === "object" && req.body !== null) {
      return Object.fromEntries(
        Object.entries(req.body as Record<string, unknown>).map(([key, value]) => [
          key,
          String(value ?? ""),
        ]),
      );
    }
  }

  const raw = await readRawBody(req);
  return Object.fromEntries(new URLSearchParams(raw));
}

export function getQueryParam(req: ApiRequest, name: string): string | null {
  const fromQuery = req.query?.[name];
  if (Array.isArray(fromQuery)) return fromQuery[0] ?? null;
  if (typeof fromQuery === "string") return fromQuery;

  const url = new URL(req.url ?? "/", "http://localhost");
  return url.searchParams.get(name);
}

async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function handleApiError(
  res: ApiResponse,
  error: unknown,
  fallbackMessage = "Internal server error",
) {
  if (error instanceof ApiError) {
    sendJson(res, error.statusCode, { error: error.message });
    return;
  }

  if (error instanceof SyntaxError) {
    sendJson(res, 400, { error: "Invalid request body" });
    return;
  }

  console.error("[flow-api] unexpected error", getSafeError(error));
  sendJson(res, 500, { error: fallbackMessage });
}

function getSafeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
}
