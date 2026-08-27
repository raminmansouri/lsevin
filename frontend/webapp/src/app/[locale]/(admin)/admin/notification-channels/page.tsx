import { MyNotificationPreferences } from "@/features/notification/admin/components/my-notification-preferences";
import { NotificationChannelsDashboard } from "@/features/notification/admin/components/notification-channels-dashboard";
import { listChannelConfigs } from "@/features/notification/server/channel.repository";

export default async function NotificationChannelsPage() {
  const channels = await listChannelConfigs();
  const push = channels.find((c) => c.code === "push");
  const bale = channels.find((c) => c.code === "bale");

  return (
    <div className="space-y-6">
      <MyNotificationPreferences
        pushEnabled={Boolean(push?.isEnabled)}
        vapidPublicKey={push?.settings.vapidPublicKey ?? null}
        baleEnabled={Boolean(bale?.isEnabled)}
        baleBotUsername={bale?.settings.baleBotUsername ?? null}
      />
      <NotificationChannelsDashboard channels={channels} />
    </div>
  );
}
