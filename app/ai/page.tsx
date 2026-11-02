import type { Metadata } from "next";
import { Suspense } from "react";
import { AiView } from "@/components/ai/ai-view";
import { ClientOnly } from "@/components/client-only";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "ผู้ช่วย AI" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <AiView />
      </ClientOnly>
    </Suspense>
  );
}
