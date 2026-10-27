import { Percent } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { MetricsOverview } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

import type { LoadState } from "./load";

interface CommissionsViewProps {
  metrics: LoadState<MetricsOverview>;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl tabular-nums leading-none tracking-tight">{value}</div>
        <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function CommissionsView({ metrics }: CommissionsViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Comissões cobradas" value="—" hint="Sem endpoint de leitura na API." />
        <Kpi label="Modelo de comissão" value="—" hint="Percentual e valor fixo por província — não expostos." />
        <Kpi
          label="Receita de referência (30 d)"
          value={metrics.failed ? "—" : formatKz(metrics.data?.revenue.current ?? 0)}
          hint="Receita de reservas, usada como base de cálculo quando existir a tabela de comissões."
        />
      </div>

      <Alert variant="destructive">
        <AlertTitle>Comissões indisponíveis para consulta</AlertTitle>
        <AlertDescription>
          A base de dados da peladeiro-api contém a tabela <code className="font-mono">platform_fees</code> (província,
          percentagem, valor fixo, activo), mas nenhum endpoint a lê. Apresentar valores aqui obrigaria a inventar dados
          — por isso esta secção fica com «—» até a API publicar a leitura das comissões.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-none">Valores cobrados pela plataforma</CardTitle>
          <p className="text-muted-foreground text-sm">
            Este módulo é administrativo: aqui só se consultam as comissões do modelo de negócio, nunca se alteram
            valores de reservas já pagas.
          </p>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Percent />
              </EmptyMedia>
              <EmptyTitle>Sem dados de comissões</EmptyTitle>
              <EmptyDescription>
                A API não expõe <code className="font-mono">GET /finance/fees</code> nem um cálculo agregado de
                comissões. Quando existir, esta secção passa a listar o valor cobrado por período, província e
                transacção.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
