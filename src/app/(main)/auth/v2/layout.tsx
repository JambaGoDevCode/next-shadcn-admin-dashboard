import type { ReactNode } from "react";

import { Command } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { ModalityCarousel } from "./_components/modality-carousel";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full overflow-hidden rounded-3xl bg-primary lg:flex">
          <ModalityCarousel />

          <div className="pointer-events-none absolute top-10 left-10 z-30 space-y-1 text-primary-foreground">
            <Command className="size-10" />
            <h1 className="font-medium text-2xl">{APP_CONFIG.name}</h1>
            <p className="text-sm">Todas as modalidades. Um só lugar.</p>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
