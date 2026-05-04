export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const iconUrl = new URL("/icon.png", request.url);
  const response = await fetch(iconUrl, { cache: "no-store" });
  const body = await response.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
