/**
 * IdentityLock AI Cloudflare Worker.
 * Static storefront is served from the repository. /api/* is temporarily
 * forwarded to the existing Vercel API until the handlers are ported and tested.
 */
const API_ORIGIN = "https://identitylock-ai.vercel.app";

export default {
  async fetch(request, env) {
    const incomingUrl = new URL(request.url);

    if (incomingUrl.pathname === "/api" || incomingUrl.pathname.startsWith("/api/")) {
      const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, API_ORIGIN);
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.set("x-forwarded-host", incomingUrl.host);
      headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

      const init = { method: request.method, headers, redirect: "manual" };
      if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

      const upstream = await fetch(new Request(upstreamUrl, init));
      const responseHeaders = new Headers(upstream.headers);
      responseHeaders.set("Cache-Control", "private, no-store, max-age=0");
      responseHeaders.set("X-Content-Type-Options", "nosniff");

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders
      });
    }

    return env.ASSETS.fetch(request);
  }
};
