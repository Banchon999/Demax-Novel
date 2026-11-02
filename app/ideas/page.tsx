import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { IdeasView } from "@/components/ideas/ideas-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "กล่องไอเดีย" };

export default function IdeasPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <IdeasView />
      </ClientOnly>
    </Suspense>
  );
}
