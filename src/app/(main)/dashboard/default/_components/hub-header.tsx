import { LayoutGrid } from "lucide-react";

export function HubHeader() {
  return (
    <header className="flex items-start gap-3 border-b pb-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <LayoutGrid className="size-5" />
      </span>
      <div className="space-y-0.5">
        <h1 className="font-medium text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral e indicadores da plataforma.</p>
      </div>
    </header>
  );
}
