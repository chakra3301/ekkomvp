import type { Metadata } from "next";

import { DiscoverPage } from "@/components/discover/discover-page";

export const metadata: Metadata = {
  title: "Discover Creatives",
  description: "Find talented creatives on EKKO",
};

export default function Discover() {
  return <DiscoverPage />;
}
