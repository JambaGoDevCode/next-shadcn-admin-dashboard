import Link from "next/link";

import type { LucideIcon } from "lucide-react";

export interface ModuleCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Real API value rendered as a subtle supporting line. Omit when the API has no data for the module. */
  metric?: string;
  /** The operations grid uses plain icons; the two admin entries show them boxed, as in the reference. */
  iconVariant?: "plain" | "boxed";
}

export function ModuleCard({ href, icon: Icon, title, description, metric, iconVariant = "plain" }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {iconVariant === "boxed" ? (
        <span className="flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      ) : (
        <Icon className="size-5 text-foreground" />
      )}
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {metric && <p className="text-muted-foreground text-xs tabular-nums">{metric}</p>}
    </Link>
  );
}
