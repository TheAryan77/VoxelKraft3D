import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/shop/status";

/* Buttons: molten = the live action, outline = everything else. */
const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-[transform,background-color,border-color,color,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";
export const buttonStyles = {
  molten: cn(buttonBase, "bg-molten text-on-molten hover:bg-molten-hover"),
  outline: cn(buttonBase, "border border-line text-text hover:border-pei/60"),
  ghost: cn(buttonBase, "px-3 text-text-muted hover:text-text"),
  danger: cn(buttonBase, "border border-line text-error hover:border-error/60"),
};

export function Button({
  variant = "molten",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: keyof typeof buttonStyles }) {
  return <button className={cn(buttonStyles[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "molten",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: keyof typeof buttonStyles }) {
  return <Link className={cn(buttonStyles[variant], className)} {...props} />;
}

/* Form fields */
export const inputStyles =
  "h-11 w-full rounded-[12px] border border-line bg-surface-2 px-4 text-sm text-text placeholder:text-text-muted/60 transition-colors hover:border-pei/40 focus-visible:border-pei/60";

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm text-text-muted">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-text-muted">{hint}</span>}
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}

/* Layout */
export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-heading text-[length:var(--text-heading)] text-text">{title}</h1>
        {sub && <p className="prose-body mt-3 text-base text-text-muted md:text-lg">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("rounded-[20px] border border-line bg-surface p-5 md:p-6", className)} {...props} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-start gap-3 py-10">
      <p className="font-heading text-xl text-text">{title}</p>
      {body && <p className="text-sm text-text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

const toneClass = {
  muted: "border-line text-text-muted",
  live: "border-molten/40 bg-molten/10 text-molten",
  done: "border-pei/40 bg-pei/10 text-pei",
  bad: "border-error/40 text-error",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", toneClass[ORDER_STATUS_TONE[status]], className)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-xs text-text-muted", className)}>{children}</span>;
}
