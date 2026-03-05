import { NextResponse } from "next/server";
import { prisma } from "@ekko/database";

// In-memory cache to avoid hammering Instagram
const cache = new Map<string, { data: unknown; expires: number }>();

const EMPTY: { profilePicUrl: string | null; posts: { imageUrl: string }[] } = { profilePicUrl: null, posts: [] };

/** Refresh a long-lived token if it expires within 7 days */
async function refreshTokenIfNeeded(
  profileId: string,
  token: string,
  expiry: Date
) {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (expiry.getTime() - Date.now() > sevenDays) return token;

  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    );
    if (!res.ok) return token;

    const data = await res.json();
    const newExpiry = new Date(Date.now() + data.expires_in * 1000);

    await prisma.connectProfile.update({
      where: { id: profileId },
      data: {
        instagramAccessToken: data.access_token,
        instagramTokenExpiry: newExpiry,
      },
    });

    return data.access_token as string;
  } catch {
    return token;
  }
}

/** Fetch Instagram data using the official Graph API with a stored token */
async function fetchWithToken(profileId: string, token: string, expiry: Date) {
  const accessToken = await refreshTokenIfNeeded(profileId, token, expiry);

  // Fetch profile info
  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=username,profile_picture_url&access_token=${accessToken}`
  );

  let profilePicUrl: string | null = null;
  if (profileRes.ok) {
    const profileData = await profileRes.json();
    if (profileData.profile_picture_url) {
      profilePicUrl = `/api/instagram/image?url=${encodeURIComponent(profileData.profile_picture_url)}`;
    }
  }

  // Fetch recent media
  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url&limit=3&access_token=${accessToken}`
  );

  const posts: { imageUrl: string }[] = [];
  if (mediaRes.ok) {
    const mediaData = await mediaRes.json();
    for (const item of mediaData.data || []) {
      const url =
        item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url;
      if (url) {
        posts.push({
          imageUrl: `/api/instagram/image?url=${encodeURIComponent(url)}`,
        });
      }
    }
  }

  return { profilePicUrl, posts };
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

  // Attempt 1: Use stored OAuth token (official Graph API)
  try {
    const profile = await prisma.connectProfile.findFirst({
      where: { instagramHandle: handle },
      select: {
        id: true,
        instagramAccessToken: true,
        instagramTokenExpiry: true,
      },
    });

    if (
      profile?.instagramAccessToken &&
      profile?.instagramTokenExpiry &&
      profile.instagramTokenExpiry > new Date()
    ) {
      result = await fetchWithToken(
        profile.id,
        profile.instagramAccessToken,
        profile.instagramTokenExpiry
      );
    }
  } catch {
    // Token fetch failed — fall through
  }

  // Attempt 2: Scraping fallback (unreliable from cloud IPs)
  if (!result.profilePicUrl && result.posts.length === 0) {
    try {
      const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
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
      // Scraping failed too
    }
  }

  // Cache results (15 min)
  cache.set(handle, { data: result, expires: Date.now() + 900_000 });

  return NextResponse.json(result);
}
