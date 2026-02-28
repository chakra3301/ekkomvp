import { NextResponse } from "next/server";

// In-memory cache to avoid hammering Instagram
const cache = new Map<string, { data: unknown; expires: number }>();

export async function GET(
  _request: Request,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;

  // Check cache (1 hour TTL)
  const cached = cache.get(handle);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "X-IG-App-ID": "936619743392459",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Referer": "https://www.instagram.com/",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ profilePicUrl: null, posts: [] });
    }

    const json = await res.json();
    const user = json?.data?.user;

    if (!user) {
      return NextResponse.json({ profilePicUrl: null, posts: [] });
    }

    const rawPic = user.profile_pic_url_hd || user.profile_pic_url || null;
    const profilePicUrl = rawPic
      ? `/api/instagram/image?url=${encodeURIComponent(rawPic)}`
      : null;

    const posts = (user.edge_owner_to_timeline_media?.edges || [])
      .slice(0, 3)
      .map((edge: Record<string, Record<string, string>>) => {
        const raw = edge.node.thumbnail_src || edge.node.display_url;
        return { imageUrl: `/api/instagram/image?url=${encodeURIComponent(raw)}` };
      });

    const result = { profilePicUrl, posts };
    cache.set(handle, { data: result, expires: Date.now() + 3600000 });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ profilePicUrl: null, posts: [] });
  }
}
