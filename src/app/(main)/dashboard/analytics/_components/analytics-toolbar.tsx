"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Ellipsis, FileDown, FileUp, RefreshCw, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANGE_OPTIONS = [
  { value: "last-7-days", label: "Últimos 7 dias" },
  { value: "last-4-weeks", label: "Últimas 4 semanas" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "year-to-date", label: "Ano até à data" },
] as const;

export function AnalyticsToolbar({ current }: { current: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-2" aria-busy={pending}>
      <Select
        value={current}
        onValueChange={(value) => {
          if (value === current) return;
          startTransition(() => {
            router.replace(`/dashboard/analytics?range=${value}`, { scroll: false });
          });
        }}
      >
        <SelectTrigger className={pending ? "w-34 opacity-70" : "w-34"}>
          <SelectValue placeholder="Selecionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" aria-label="Mais ações de análise">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Ações de análise</DropdownMenuLabel>
            <DropdownMenuItem>
              <FileDown />
              Exportar relatório
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileUp />
              Importar dados
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 />
              Partilhar painel
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => router.refresh()}>
              <RefreshCw />
              Atualizar métricas
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
