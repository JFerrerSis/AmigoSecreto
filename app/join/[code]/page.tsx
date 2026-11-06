import type { Metadata } from "next";

import { JoinRoom } from "@/components/groups/join-room";

export const metadata: Metadata = {
  title: "Invitación",
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <JoinRoom code={code} />;
}
