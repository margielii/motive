// The synthetic build has no account, guest, bootstrap or data API surface.
// Hosting's owner-only access gate is separate from the fictional UI session.
export function prototypeBoundary(request: Request): Response | null {
  const path = new URL(request.url).pathname;
  const asset =
    path === "/" ||
    path === "/manifest.webmanifest" ||
    path === "/sw.js" ||
    path === "/favicon.svg" ||
    /^\/icons\/motive-(192|512|apple)\.png$/.test(path) ||
    path.startsWith("/_next/static/");
  if (asset && ["GET", "HEAD"].includes(request.method)) return null;
  return Response.json(
    { error: "Synthetic prototype: server operations disabled" },
    {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
