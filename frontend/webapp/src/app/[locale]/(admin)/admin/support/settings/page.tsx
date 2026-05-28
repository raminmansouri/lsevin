import type { Metadata } from "next";

import { SupportSettingsForm } from "@/features/support/admin/support-settings-form";
import { getSupportSettings } from "@/features/support/server/repository";

export const metadata: Metadata = {
  title: "Support Settings",
  description: "Configure floating support chat and support labels.",
};

export default async function AdminSupportSettingsPage() {
  const settings = await getSupportSettings();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support settings</h1>
        <p className="text-sm text-muted-foreground">Enable chat, configure labels, and customize the floating widget skin.</p>
      </div>
      <SupportSettingsForm settings={settings} />
    </div>
  );
}
