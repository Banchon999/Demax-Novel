import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { ProjectView } from "@/components/project/project-view";
import { Loading } from "@/components/ui";

export const metadata: Metadata = { title: "เรื่อง" };

export default function ProjectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnly>
        <ProjectView />
      </ClientOnly>
    </Suspense>
  );
}
