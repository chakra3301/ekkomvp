import type { Metadata } from "next";

import { CollectiveDetailPage } from "@/components/collectives/collective-detail-page";

export const metadata: Metadata = {
  title: "Collective",
  description: "View collective on EKKO",
};

export default function CollectiveDetail({ params }: { params: { slug: string } }) {
  return <CollectiveDetailPage slug={params.slug} />;
}
