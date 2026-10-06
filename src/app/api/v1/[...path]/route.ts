import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8088";

function getCorsHeaders(origin: string | null = "*"): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Session-Token, Idempotency-Key, Accept, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const origin = request.headers.get("origin");
  const subPath = (params.path || []).join("/");
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_BASE}/api/v1/${subPath}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Exclude host, content-length, and accept-encoding so fetch handles decompression cleanly
    if (
      lower !== "host" &&
      lower !== "connection" &&
      lower !== "content-length" &&
      lower !== "accept-encoding"
    ) {
      headers.set(key, value);
    }
  });

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const bodyText = await request.text();
      if (bodyText && bodyText.length > 0) {
        fetchOptions.body = bodyText;
        (fetchOptions as any).duplex = "half";
      }
    }

    let backendResponse: Response;
    try {
      backendResponse = await fetch(targetUrl, fetchOptions);
    } catch (initialErr) {
      // Fast single retry to absorb transient Windows loopback socket resets during concurrent bursts
      await new Promise((resolve) => setTimeout(resolve, 60));
      backendResponse = await fetch(targetUrl, fetchOptions);
    }
    const responseHeaders = new Headers();

    // Copy backend response headers, stripping content-encoding and content-length
    // because Node.js fetch automatically decompresses the body in memory.
    backendResponse.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== "content-encoding" &&
        lower !== "content-length" &&
        lower !== "transfer-encoding"
      ) {
        responseHeaders.set(key, val);
      }
    });

    // Enforce permissive CORS headers on the response
    const cors = getCorsHeaders(origin);
    Object.entries(cors).forEach(([k, v]) => {
      responseHeaders.set(k, v as string);
    });

    const isNullBodyStatus =
      backendResponse.status === 304 ||
      backendResponse.status === 204 ||
      backendResponse.status === 205 ||
      backendResponse.status === 101;

    const responseBody = isNullBodyStatus
      ? null
      : await backendResponse.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[API Proxy Error] ${request.method} ${targetUrl}:`, error);
    return NextResponse.json(
      { error: "Backend proxy unreachable", details: error.message },
      { status: 502, headers: getCorsHeaders(origin) }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
