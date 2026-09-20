import { notFound } from "next/navigation";
import { getGroupById } from "@/lib/data";
import { GroupDetailClient } from "@/components/group-detail-client";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = getGroupById(decodeURIComponent(id));
  if (!group) notFound();

  return <GroupDetailClient group={group} />;
}
