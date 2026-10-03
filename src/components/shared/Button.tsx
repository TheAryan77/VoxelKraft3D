"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { useReducedMotion } from "@/lib/useReducedMotion";

type LinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children" | "as"> & {
  className?: string;
  children: ReactNode;
};

/** Solid molten pill. The site's "live" action. */
export function MoltenButton({ className, children, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full bg-molten px-7 text-sm font-semibold text-on-molten transition-[transform,background-color] duration-150 hover:bg-molten-hover active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Pill with a molten glow travelling around the border. Two on the whole site, max. */
export function MovingBorderLink({
  className,
  children,
  containerClassName,
  live = true,
  ...props
}: LinkProps & { live?: boolean; containerClassName?: string }) {
  const reduced = useReducedMotion();
  return (
    <MovingBorderButton
      as={Link}
      animate={live && !reduced}
      containerClassName={cn("h-12", !live && "[&>div:first-child]:opacity-0", containerClassName)}
      className={cn(!live && "border-line", className)}
      {...props}
    >
      {children}
    </MovingBorderButton>
  );
}

/** Quiet text action that underlines on hover. */
export function TextButton({ className, children, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex h-12 items-center text-sm font-medium text-text underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color,transform] duration-200 hover:decoration-text-muted active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
