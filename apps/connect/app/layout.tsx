import type { Metadata, Viewport } from "next";
import { Inter, Quattrocento_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCProvider } from "@/lib/trpc/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { NativeBridgeProvider } from "@/components/native-bridge-provider";

import "./globals.css";

const fontHeading = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const fontBody = Quattrocento_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0080FF",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_CONNECT_URL || "https://connect.ekko.app"
  ),
  title: {
    default: "EKKO Connect — Find Your Creative Match",
    template: "%s | EKKO Connect",
  },
  description:
    "Find your creative match. Discover collaborators, clients, and creatives on EKKO Connect — the matchmaking platform built for the creative industry.",
  keywords: [
    "creative network",
    "collaborator matching",
    "creative professionals",
    "EKKO",
    "design",
    "music",
    "photography",
    "creative community",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "EKKO Connect",
    title: "EKKO Connect — Find Your Creative Match",
    description:
      "Discover collaborators, clients, and creatives. Swipe, match, and create together.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EKKO Connect",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EKKO Connect — Find Your Creative Match",
    description:
      "Discover collaborators, clients, and creatives. Swipe, match, and create together.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="EKKO Connect" />
      </head>
      <body
        className={`${fontHeading.variable} ${fontBody.variable} font-body antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          <TRPCProvider>
            <NativeBridgeProvider>
              {children}
            </NativeBridgeProvider>
            <Toaster position="bottom-center" richColors />
            <ServiceWorkerRegister />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
