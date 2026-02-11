import type { Metadata } from "next";
import { Inter, Quattrocento_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { siteConfig } from "@ekko/config";
import { TRPCProvider } from "@/lib/trpc/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeAccentSync } from "@/components/theme-accent-sync";
import { LoginPromptProvider } from "@/components/auth/login-prompt-provider";

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

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  keywords: [
    "creative",
    "freelance",
    "portfolio",
    "design",
    "music",
    "video",
    "animation",
    "illustration",
    "photography",
    "hire creatives",
    "creative professionals",
  ],
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: "@ekkoapp",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          <ThemeAccentSync />
          <TRPCProvider>
            <LoginPromptProvider>
              {children}
            </LoginPromptProvider>
            <Toaster position="bottom-right" richColors />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
