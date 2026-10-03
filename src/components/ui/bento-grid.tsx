// Aceternity UI — Bento Grid, restyled: warm surface tiles, 20px radius,
// no shadows. Three columns on desktop, one on mobile.
import { cn } from "@/lib/utils";

export const BentoGrid = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:auto-rows-[28rem] md:grid-cols-3", className)}>{children}</div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  footer,
  ...props
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "title">) => {
  return (
    <div
      className={cn(
        "group/bento relative flex flex-col rounded-[20px] border border-line bg-surface p-2 transition-colors duration-300 hover:border-pei/40",
        className,
      )}
      {...props}
    >
      {header}
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3">
        <h3 className="font-heading text-xl text-text">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </div>
    </div>
  );
};
