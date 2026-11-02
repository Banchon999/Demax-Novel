import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { Loading } from "@/components/ui";
import { WriteView } from "@/components/write/write-view";

export const metadata: Metadata = { title: "เขียน" };

export default function WritePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <WriteView />
      </ClientOnly>
    </Suspense>
  );
}
