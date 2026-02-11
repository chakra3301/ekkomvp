import type { Metadata } from "next";

import { CollectivesPage } from "@/components/collectives/collectives-page";

export const metadata: Metadata = {
  title: "Collectives",
  description: "Browse and join creative collectives on EKKO",
};

export default function Collectives() {
  return <CollectivesPage />;
}
