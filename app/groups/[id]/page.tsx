import type { Metadata } from "next";

import { GroupRoom } from "@/components/groups/group-room";

export const metadata: Metadata = {
  title: "Sala",
};

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GroupRoom groupId={id} />;
}
