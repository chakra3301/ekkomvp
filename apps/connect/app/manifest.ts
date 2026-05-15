import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EKKO",
    short_name: "EKKO",
    description: "Invite-only by design. Built for taste, not noise.",
    start_url: "/",
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
