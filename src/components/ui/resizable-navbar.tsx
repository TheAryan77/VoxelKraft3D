"use client";
// Aceternity UI — Resizable Navbar, restyled for Voxel Kraft 3D:
// transparent at the top, a dark blurred pill (72 → 60px, narrower) after 40px.
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";

import React, { useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  id?: string;
}

const SCROLL_THRESHOLD = 40;
const spring = { type: "spring", stiffness: 260, damping: 40 } as const;

export const Navbar = ({ children, className }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > SCROLL_THRESHOLD);
  });

  return (
    <div className={cn("fixed inset-x-0 top-0 z-50 w-full", className)} data-cursor="">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child,
      )}
    </div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      initial={false}
      animate={{
        maxWidth: visible ? 960 : 1280,
        height: visible ? 60 : 72,
        y: visible ? 12 : 0,
      }}
      transition={spring}
      className={cn(
        "relative z-[60] mx-auto hidden w-full flex-row items-center justify-between self-start rounded-full border px-3 lg:flex",
        "border-transparent bg-transparent transition-[background-color,border-color,backdrop-filter] duration-300",
        visible && "border-line bg-surface/70 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-1 text-sm font-medium text-text-muted lg:flex pointer-events-none",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onFocus={() => setHovered(idx)}
          onClick={onItemClick}
          className="pointer-events-auto relative rounded-full px-4 py-2 transition-colors hover:text-text focus-visible:text-text"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div layoutId="nav-hovered" className="absolute inset-0 h-full w-full rounded-full bg-surface-2" />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      initial={false}
      animate={{ height: visible ? 60 : 72, y: visible ? 10 : 0 }}
      transition={spring}
      className={cn(
        "relative z-[70] mx-auto flex w-[calc(100%-1.5rem)] flex-col justify-center rounded-full border px-3 lg:hidden",
        "border-transparent bg-transparent transition-[background-color,border-color] duration-300",
        visible && "border-line bg-surface/70 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
  return <div className={cn("relative z-[70] flex w-full flex-row items-center justify-between", className)}>{children}</div>;
};

/** Full-screen sheet with links stacked large. */
export const MobileNavMenu = ({ children, className, isOpen, id }: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-lenis-prevent
          className={cn(
            "fixed inset-0 z-[65] flex flex-col justify-between overflow-y-auto bg-bg px-5 pb-10 pt-28",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
  openLabel,
  closeLabel,
  controls,
}: {
  isOpen: boolean;
  onClick: () => void;
  openLabel: string;
  closeLabel: string;
  controls?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={controls}
      aria-label={isOpen ? closeLabel : openLabel}
      className="grid h-11 w-11 place-items-center rounded-full text-text transition active:scale-[0.97]"
    >
      {isOpen ? <IconX size={22} stroke={1.5} /> : <IconMenu2 size={22} stroke={1.5} />}
    </button>
  );
};
