import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EKKO Connect",
    short_name: "Connect",
    description:
      "Find your creative match. Discover collaborators, clients, and creatives.",
    start_url: "/discover",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#0080FF",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
