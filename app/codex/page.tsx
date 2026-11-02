import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { CodexView } from "@/components/codex/codex-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "Codex" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <CodexView />
      </ClientOnly>
    </Suspense>
  );
}
