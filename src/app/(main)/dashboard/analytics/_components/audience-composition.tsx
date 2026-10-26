import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsAssets } from "@/lib/api/types";
import { profileTypeLabel } from "@/lib/format";

interface AudienceCompositionProps {
  data: AnalyticsAssets | null;
  failed: boolean;
}

const numberFormatter = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

/** Papel principal de cada utilizador — composição da comunidade. */
export function AudienceComposition({ data, failed }: AudienceCompositionProps) {
  const profiles = data?.byProfile ?? [];
  const total = profiles.reduce((sum, profile) => sum + profile.count, 0);

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Composição da comunidade</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 font-normal">Papel</TableHead>
              <TableHead className="h-8 w-28 text-right font-normal">Utilizadores</TableHead>
              <TableHead className="h-8 w-28 text-right font-normal">Participação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {failed && !data ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                  Não foi possível carregar os dados. Verifique se a API está em execução.
                </TableCell>
              </TableRow>
            ) : profiles.length > 0 ? (
              profiles.map((profile) => (
                <TableRow className="hover:bg-transparent" key={profile.type}>
                  <TableCell className="py-3 font-medium">{profileTypeLabel(profile.type)}</TableCell>
                  <TableCell className="py-3 text-right tabular-nums">
                    {numberFormatter.format(profile.count)}
                  </TableCell>
                  <TableCell className="py-3 text-right text-muted-foreground tabular-nums">
                    {total > 0 ? `${Math.round((profile.count / total) * 100)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                  Sem utilizadores para exibir.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <p className="px-4 pt-3 text-muted-foreground text-xs">
          Papel principal atribuído a cada conta (fallback: tipo de conta).
        </p>
      </CardContent>
    </Card>
  );
}
