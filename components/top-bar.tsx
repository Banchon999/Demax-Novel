import Link from "next/link";
import type { ReactNode } from "react";
import { SearchIcon } from "./icons";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-accent/30"
      >
        D
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        DEMAX <span className="text-accent">NOVEL</span>
      </span>
    </Link>
  );
}

/** Sticky page header. Defaults to the logo plus a search shortcut. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-bg/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        {children ?? (
          <>
            <Logo />
            <Link
              href="/search"
              aria-label="ค้นหานิยาย"
              className="grid size-10 place-items-center rounded-full text-fg/80 transition-colors hover:bg-white/10 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <SearchIcon className="size-5" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-lg font-bold">{children}</h1>;
}
