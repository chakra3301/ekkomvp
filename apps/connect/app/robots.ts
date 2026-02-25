import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/discover",
        "/profile/",
        "/matches/",
        "/likes/",
        "/settings/",
        "/browse/",
        "/api/",
      ],
    },
  };
}
