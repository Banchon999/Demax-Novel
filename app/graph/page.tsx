import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { GraphView } from "@/components/graph/graph-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "ความสัมพันธ์" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <GraphView />
      </ClientOnly>
    </Suspense>
  );
}
