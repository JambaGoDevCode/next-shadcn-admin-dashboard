"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRight, Ban, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { City, RecentUser, Team } from "@/lib/api/types";
import { createCityLabeler, formatDate, plural } from "@/lib/format";
import { deleteTeamAction } from "@/server/actions/management";

import { createOwnerLabeler } from "./team-labels";

interface TeamStatusListProps {
  teams: Team[];
  cities: City[];
  users: RecentUser[];
  failed: boolean;
}

/**
 * Estado das equipas: agrupa activas e inactivas, permite suspender uma equipa
 * (soft delete em DELETE /teams/:id) e liga ao detalhe para correção de dados.
 */
export function TeamStatusList({ teams, cities, users, failed }: TeamStatusListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const cityLabel = createCityLabeler(cities);
  const ownerLabel = createOwnerLabeler(users);

  const active = teams.filter((team) => team.isActive !== false);
  const inactive = teams.filter((team) => team.isActive === false);

  async function handleSuspend(teamId: number) {
    setPendingId(teamId);
    const result = await deleteTeamAction(teamId);
    setPendingId(null);
    if (result.ok) {
      toast.success("Equipa suspensa (removida da listagem activa).");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function teamRow(team: Team, suspended: boolean) {
    return (
      <li key={team.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{team.name}</p>
            <Badge variant={suspended ? "destructive" : "default"}>{suspended ? "Inactiva" : "Activa"}</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {cityLabel(team.cityId)} · Responsável: {ownerLabel(team.ownerId)}
          </p>
          <p className="text-muted-foreground/80 text-xs">
            Registo {formatDate(team.createdAt)} · Última alteração {formatDate(team.updatedAt)}
            {suspended ? " · Suspensa (soft delete)" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {suspended ? (
            <span className="text-muted-foreground text-xs">
              Sem endpoint de reactivação
            </span>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={pendingId === team.id}>
                  <Ban /> Suspender
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspender a equipa {team.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A suspensão usa o «remover» da API, que é uma eliminação lógica: a equipa passa a{" "}
                    <code>isActive: false</code> e desaparece das listagens públicas. Como a API não tem endpoint de
                    reactivação, <strong>não será possível desfazer por aqui</strong> — confirme apenas em caso de
                    violação das regras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void handleSuspend(team.id);
                    }}
                  >
                    Suspender equipa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Link
            href={`/dashboard/teams?teamId=${team.id}`}
            aria-label={`Consultar a equipa ${team.name}`}
            className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowRight />
          </Link>
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Equipas activas</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : active.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">Disponíveis em listagens e torneios</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Equipas inactivas</CardTitle>
            <Ban className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : inactive.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">Suspensas ou removidas (soft delete)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Total</CardTitle>
            <TriangleAlert className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : teams.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">Registos detectados na API</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activas</CardTitle>
          <CardDescription>
            {active.length} {plural(active.length, "equipa", "equipas")} — consultar, corrigir dados mediante
            autorização ou suspender por violação das regras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failed ? (
            <p className="text-muted-foreground py-6 text-center text-sm">— API indisponível</p>
          ) : active.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Sem equipas activas.</p>
          ) : (
            <ul className="divide-y text-sm">{active.map((team) => teamRow(team, false))}</ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inactivas</CardTitle>
          <CardDescription>
            {inactive.length} {plural(inactive.length, "equipa", "equipas")} fora das listagens públicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failed ? (
            <p className="text-muted-foreground py-6 text-center text-sm">— API indisponível</p>
          ) : inactive.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <ShieldCheck className="size-6 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">Nenhuma equipa inactiva.</p>
              <p className="text-muted-foreground/80 text-xs">Todas as equipas detetadas estão activas.</p>
            </div>
          ) : (
            <ul className="divide-y text-sm">{inactive.map((team) => teamRow(team, true))}</ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Nota (limitações da API): o modelo de equipa só distingue <code>isActive</code> — não existe estado
        «denunciada» nem «suspensa» com motivo, duração ou histórico; esses campos ficarão aqui quando o backend os
        suportar. A listagem <code>GET /teams</code> devolve apenas activas, por isso as inactivas são detetadas por
        consulta directa dos ids registados (<code>GET /teams/:id</code>). Resolver conflitos passa pela consulta do
        detalhe da equipa e pelo contacto com os responsáveis.
      </p>
    </div>
  );
}
