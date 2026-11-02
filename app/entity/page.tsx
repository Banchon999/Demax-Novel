import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { EntityView } from "@/components/codex/entity-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "ข้อมูล" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <EntityView />
      </ClientOnly>
    </Suspense>
  );
}
