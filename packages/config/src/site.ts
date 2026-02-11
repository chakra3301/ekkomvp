export const siteConfig = {
  name: "EKKO",
  description: "The LinkedIn for Creatives - Where creatives connect, collaborate, and get hired.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com/ekkoapp",
    github: "https://github.com/ekko",
  },
  creator: "EKKO Team",
} as const;

export type SiteConfig = typeof siteConfig;
