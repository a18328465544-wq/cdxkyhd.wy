import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot on wide screens (a link, a filter, a CTA). */
  action?: ReactNode;
  tone?: "light" | "dark";
  titleId?: string;
  className?: string;
}

export default function SectionHeader({ eyebrow, title, description, action, tone = "light", titleId, className = "" }: SectionHeaderProps) {
  const dark = tone === "dark";
  return (
    <header className={`mb-7 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div className="max-w-2xl">
        <p className={`text-sm font-semibold ${dark ? "text-blue-300" : "text-blue-700"}`}>{eyebrow}</p>
        <h2
          id={titleId}
          className={`mt-2 font-display text-[28px] font-bold leading-tight sm:text-[32px] ${dark ? "text-white" : "text-slate-950"}`}
        >
          {title}
        </h2>
        {description && (
          <p className={`mt-3 text-sm leading-7 sm:text-base ${dark ? "text-slate-300" : "text-slate-600"}`}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
