import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL || "http://54.146.192.20:8088";

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
    // Exclude host header so target backend receives its own host
    if (lower !== "host" && lower !== "connection") {
      headers.set(key, value);
    }
  });

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const bodyBlob = await request.blob();
      if (bodyBlob.size > 0) {
        fetchOptions.body = bodyBlob;
      }
    }

    const backendResponse = await fetch(targetUrl, fetchOptions);
    const responseHeaders = new Headers();

    // Copy backend response headers
    backendResponse.headers.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    // Enforce permissive CORS headers on the response
    const cors = getCorsHeaders(origin);
    Object.entries(cors).forEach(([k, v]) => {
      responseHeaders.set(k, v as string);
    });

    const responseBody = await backendResponse.arrayBuffer();

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
