import { ClientOnly } from "@/components/client-only";
import { HomeView } from "@/components/home/home-view";
import { TopBar } from "@/components/top-bar";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <ClientOnly>
        <HomeView />
      </ClientOnly>
    </>
  );
}
