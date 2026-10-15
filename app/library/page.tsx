import type { Metadata } from "next";
import { PageTitle, TopBar } from "@/components/top-bar";
import { LibraryClient } from "./library-client";

export const metadata: Metadata = { title: "ชั้นหนังสือ" };

export default function LibraryPage() {
  return (
    <>
      <TopBar>
        <PageTitle>ชั้นหนังสือ</PageTitle>
      </TopBar>
      <main id="main" className="mx-auto max-w-2xl pt-4 pb-6">
        <LibraryClient />
      </main>
    </>
  );
}
