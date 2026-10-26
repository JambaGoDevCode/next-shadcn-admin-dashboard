import Link from "next/link";

import { ArrowRight, Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { checkApiHealth } from "../../_components/api-health";

export default async function TeamRequestsPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Pedidos e convites"
        description="Pedidos de entrada em equipas e situações que exijam intervenção administrativa."
        apiFailed={!apiOk}
      />
      <Card>
        <CardContent className="py-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>Sem pedidos por acompanhar</EmptyTitle>
              <EmptyDescription>
                A peladeiro-api ainda não expõe endpoints de pedidos de entrada nem de convites para equipas — o módulo
                de equipas só tem CRUD (criar, listar, editar e remover), sem rotas de membros ou convites. Quando
                existirem, este ecrã lista cada pedido com a equipa, o jogador, o estado da decisão (pendente, aceite,
                recusado, expirado) e as ações administrativas — aprovar, recusar e registar o motivo.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <p className="text-muted-foreground max-w-xl text-center text-xs">
                Enquanto isso, as <strong>inscrições de equipas em campeonatos</strong> (com aprovação e rejeição)
                estão disponíveis em Campeonatos → Inscrições.
              </p>
              <Link
                href="/dashboard/championships/registrations"
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Ver inscrições em campeonatos <ArrowRight />
              </Link>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
