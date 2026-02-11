import type { Metadata } from "next";

import { GigBoard } from "@/components/gigs/gig-board";

export const metadata: Metadata = {
  title: "Gig Board",
  description: "Browse and find creative gigs on EKKO",
};

export default function GigsPage() {
  return <GigBoard />;
}
