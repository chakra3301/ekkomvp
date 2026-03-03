import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  // Only allow Instagram CDN URLs
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("cdninstagram.com") && !parsed.hostname.endsWith("instagram.com")) {
      return new NextResponse("Invalid domain", { status: 403 });
    }
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://www.instagram.com/",
        "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse("Upstream error", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=900, s-maxage=900",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
