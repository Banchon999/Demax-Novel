import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { PlotView } from "@/components/plot/plot-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "พล็อต" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <PlotView />
      </ClientOnly>
    </Suspense>
  );
}
