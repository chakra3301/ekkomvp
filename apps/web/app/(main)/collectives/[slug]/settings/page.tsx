import { redirect } from "next/navigation";

export default function CollectiveSettings({ params }: { params: { slug: string } }) {
  redirect(`/collectives/${params.slug}`);
}
