import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "ตั้งค่า" };

export default function SettingsPage() {
  return (
    <ClientOnly>
      <SettingsView />
    </ClientOnly>
  );
}
