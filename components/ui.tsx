"use client";

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { CloseIcon } from "./icons";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90",
  secondary: "bg-surface-2 text-fg ring-1 ring-white/10 hover:bg-white/10",
  ghost: "text-fg/85 hover:bg-white/10",
  danger: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/25",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className = "",
  active = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={props["aria-pressed"]}
      className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 ${
        active ? "bg-accent/20 text-accent-soft" : "text-fg/80 hover:bg-white/10 hover:text-fg"
      } ${className}`}
      {...props}
    />
  );
}

/**
 * Destructive action that needs a second tap within 3s — friendlier on a
 * phone than a blocking confirm() dialog.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "แตะอีกครั้งเพื่อยืนยัน",
  className = "",
}: {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <Button
      variant="danger"
      className={className}
      onClick={() => {
        if (armed) {
          if (timer.current) clearTimeout(timer.current);
          setArmed(false);
          onConfirm();
          return;
        }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3000);
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}

/** Bottom sheet built on <dialog> for focus trapping and Esc-to-close. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-none w-full max-w-none bg-transparent p-0 text-fg backdrop:bg-black/60"
    >
      {open && (
        <div className="mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-2xl border-t border-white/10 bg-surface px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
          <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between gap-2 bg-surface px-4 pt-1">
            <h2 className="text-base font-bold">{title}</h2>
            <IconButton label="ปิด" onClick={onClose}>
              <CloseIcon className="size-5" />
            </IconButton>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-fg/90">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
      <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent-soft">{icon}</div>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 overflow-hidden rounded-full bg-white/10"
    >
      <div
        className={`h-full rounded-full transition-[width] ${pct >= 100 ? "bg-emerald-400" : "bg-accent"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-lg px-2 text-sm font-medium transition-colors ${
            value === o.value ? "bg-accent text-white" : "text-fg/80 hover:bg-white/5"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Loading() {
  return <p className="px-4 py-10 text-center text-sm text-muted">กำลังโหลด…</p>;
}

export const formatNumber = (n: number) => n.toLocaleString("th-TH");
