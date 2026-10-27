import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PaymentsTable } from "./payments-table";

const GATEWAYS = ["multicaixa", "stripe", "paypal", "afrimoney", "unitel-money"];

export function ReconciliationView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-none">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Cada vez que um pagamento é confirmado, o <code className="font-mono">ReconciliationWorker</code> ouve o
              evento <code className="font-mono">PaymentConfirmedEvent</code> e executa o{" "}
              <code className="font-mono">ReconcilePaymentUseCase</code> contra o fornecedor de pagamento.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-none">Fornecedores suportados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {GATEWAYS.map((gateway) => (
              <Badge key={gateway} variant="outline">
                {gateway}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-none">Sincronização</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              O <code className="font-mono">SyncGatewayTransactionsUseCase</code> lê as transacções do fornecedor num
              intervalo de datas, mas não existe uma rota administrativa que devolva o resultado dessa comparação.
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert variant="destructive">
        <AlertTitle>Confronto manual por enquanto</AlertTitle>
        <AlertDescription>
          Sem um <code className="font-mono">GET</code> de reconciliação, esta secção lista os registos internos com a
          coluna «Fornecedor» vazia («—»). A comparação tem de ser feita fora da interface até a API expor os dados do
          gateway.
        </AlertDescription>
      </Alert>

      <PaymentsTable variant="reconciliation" />
    </div>
  );
}
