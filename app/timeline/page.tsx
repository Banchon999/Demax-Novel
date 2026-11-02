import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { TimelineView } from "@/components/timeline/timeline-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "ไทม์ไลน์" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <TimelineView />
      </ClientOnly>
    </Suspense>
  );
}
