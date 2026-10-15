import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle, TopBar } from "@/components/top-bar";
import { SearchClient, SearchFallback } from "./search-client";

export const metadata: Metadata = { title: "ค้นหา" };

export default function SearchPage() {
  return (
    <>
      <TopBar>
        <PageTitle>ค้นหานิยาย</PageTitle>
      </TopBar>
      <main id="main" className="mx-auto max-w-2xl pt-4 pb-6">
        {/* useSearchParams reads URL data, so it must sit behind Suspense to keep the shell static. */}
        <Suspense fallback={<SearchFallback />}>
          <SearchClient />
        </Suspense>
      </main>
    </>
  );
}
