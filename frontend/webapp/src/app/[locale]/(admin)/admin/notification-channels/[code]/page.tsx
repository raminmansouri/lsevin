import { notFound } from "next/navigation";
import { NotificationChannelForm } from "@/features/notification/admin/components/notification-channel-form";
import { getChannelConfig, NOTIFICATION_CHANNEL_CODES } from "@/features/notification/server/channel.repository";

export default async function NotificationChannelSettingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!NOTIFICATION_CHANNEL_CODES.includes(code as (typeof NOTIFICATION_CHANNEL_CODES)[number])) {
    notFound();
  }

  const channel = await getChannelConfig(code, true);
  if (!channel) notFound();

  return <NotificationChannelForm channel={channel} />;
}
