import { CircleDot, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api/env";

interface ApiStatusHeaderProps {
  title: string;
  description: string;
  /** Renderiza o estado de ligação à API (verde ou destrutivo) no canto direito. */
  apiFailed?: boolean;
}

/** Cabeçalho das secções do dashboard que espelham dados da peladeiro-api. */
export function ApiStatusHeader({ title, description, apiFailed = false }: ApiStatusHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {apiFailed ? (
          <Badge variant="destructive">
            <CircleDot /> API indisponível
          </Badge>
        ) : (
          <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
            <CircleDot /> Conectado à peladeiro-api
          </Badge>
        )}
        <Badge variant="outline">
          <Server /> {getApiBaseUrl()}
        </Badge>
      </div>
    </div>
  );
}
