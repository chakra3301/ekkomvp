import { NextResponse } from "next/server";

// In-memory cache to avoid hammering Instagram
const cache = new Map<string, { data: unknown; expires: number }>();

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.instagram.com/",
};

const EMPTY = { profilePicUrl: null, posts: [] };

/** Fallback: scrape the public profile page HTML for og:image */
async function scrapeProfilePage(handle: string) {
  try {
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: {
        ...HEADERS,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) return EMPTY;

    const html = await res.text();

    // Extract og:image (usually the profile picture)
    const ogMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/
    );
    const profilePicUrl = ogMatch?.[1]
      ? `/api/instagram/image?url=${encodeURIComponent(ogMatch[1])}`
      : null;

    // Try to extract post images from embedded JSON
    const posts: { imageUrl: string }[] = [];
    const sharedDataMatch = html.match(
      /window\._sharedData\s*=\s*({.+?});<\/script>/
    );
    if (sharedDataMatch) {
      try {
        const shared = JSON.parse(sharedDataMatch[1]);
        const edges =
          shared?.entry_data?.ProfilePage?.[0]?.graphql?.user
            ?.edge_owner_to_timeline_media?.edges || [];
        edges.slice(0, 3).forEach((edge: any) => {
          const raw = edge?.node?.thumbnail_src || edge?.node?.display_url;
          if (raw) {
            posts.push({
              imageUrl: `/api/instagram/image?url=${encodeURIComponent(raw)}`,
            });
          }
        });
      } catch {
        // JSON parse failed — just use og:image
      }
    }

    return { profilePicUrl, posts };
  } catch {
    return EMPTY;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;

  // Check cache (15 min TTL)
  const cached = cache.get(handle);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  let result = EMPTY;

  // Attempt 1: Instagram internal API
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
    const res = await fetch(url, {
      headers: {
        ...HEADERS,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Referer: `https://www.instagram.com/${handle}/`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const user = json?.data?.user;

      if (user) {
        const rawPic =
          user.profile_pic_url_hd || user.profile_pic_url || null;
        const profilePicUrl = rawPic
          ? `/api/instagram/image?url=${encodeURIComponent(rawPic)}`
          : null;

        const posts = (user.edge_owner_to_timeline_media?.edges || [])
          .slice(0, 3)
          .map((edge: Record<string, Record<string, string>>) => {
            const raw = edge.node.thumbnail_src || edge.node.display_url;
            return {
              imageUrl: `/api/instagram/image?url=${encodeURIComponent(raw)}`,
            };
          });

        result = { profilePicUrl, posts };
      }
    }
  } catch {
    // API failed — fall through to fallback
  }

  // Attempt 2: HTML scraping fallback if API returned no data
  if (!result.profilePicUrl && result.posts.length === 0) {
    result = await scrapeProfilePage(handle);
  }

  // Cache even empty results to avoid hammering Instagram
  cache.set(handle, { data: result, expires: Date.now() + 900_000 });

  return NextResponse.json(result);
}
