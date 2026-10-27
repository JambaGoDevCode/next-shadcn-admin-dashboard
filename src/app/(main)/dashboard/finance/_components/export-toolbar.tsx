"use client";

import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ExportFormat = "excel" | "pdf" | "csv";

interface ExportToolbarProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  /** Texto do botão (por omissão: "Exportar"). */
  label?: string;
}

/** Barra de exportação das listagens financeiras: Excel, PDF e CSV. */
export function ExportToolbar({ onExport, disabled = false, label = "Exportar" }: ExportToolbarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FileDown />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={disabled} onClick={() => onExport("excel")}>
          Excel (.xls)
        </DropdownMenuItem>
        <DropdownMenuItem disabled={disabled} onClick={() => onExport("pdf")}>
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem disabled={disabled} onClick={() => onExport("csv")}>
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
