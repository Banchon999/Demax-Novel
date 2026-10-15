import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

export function SectionHeader({
  id,
  title,
  subtitle,
  icon,
  moreHref,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  moreHref?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <div>
        <h2 id={id} className="flex items-center gap-2 text-xl font-bold">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          className="flex shrink-0 items-center gap-0.5 rounded-md text-sm font-medium text-accent-soft hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ดูทั้งหมด
          <span className="sr-only">{title}</span>
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
