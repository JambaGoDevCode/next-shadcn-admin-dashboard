"use client";

import { type ReactNode, useCallback, useEffect, useState, useTransition } from "react";

import { Check, ClipboardList, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Team, TournamentRegistration } from "@/lib/api/types";
import { createTeamLabeler, formatDate, plural } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import {
  approveRegistrationAction,
  listRegistrationsAction,
  registerTeamAction,
  rejectRegistrationAction,
  removeRegistrationAction,
} from "@/server/actions/championships";

import { registrationStatusLabel, registrationStatusVariant } from "./championship-labels";

interface ChampionshipRegistrationsCardProps {
  tournamentId: number;
  /** Equipas ativas — rótulos e opções de inscrição. */
  teams: Team[];
}

/**
 * Inscrições do campeonato (GET /tournaments/:id/registrations) — inscrever
 * equipas e aprovar/rejeitar/remover inscrições, com recarga independente.
 */
export function ChampionshipRegistrationsCard({ tournamentId, teams }: ChampionshipRegistrationsCardProps) {
  const [registrations, setRegistrations] = useState<TournamentRegistration[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [teamId, setTeamId] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Inscrições — recarrega no mount, a cada refreshKey e quando o campeonato muda.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listRegistrationsAction(tournamentId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setRegistrations(result.data);
          setError(null);
        } else {
          setRegistrations(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRegistrations(null);
        setError("Não foi possível carregar as inscrições.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tournamentId, refreshKey]);

  const teamLabel = createTeamLabeler(teams);
  const registeredTeamIds = new Set((registrations ?? []).map((registration) => registration.teamId));
  const availableTeams = teams.filter((team) => !registeredTeamIds.has(team.id));

  function handleRegister() {
    const parsedTeamId = Number(teamId);
    if (!teamId || !Number.isInteger(parsedTeamId)) {
      toast.error("Selecione uma equipa para inscrever.");
      return;
    }
    setActiveAction("register");
    startTransition(async () => {
      try {
        const result = await registerTeamAction({ tournamentId, teamId: parsedTeamId });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Equipa inscrita.");
        setTeamId("");
        refresh();
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleApprove(registration: TournamentRegistration) {
    setActiveAction(`approve-${registration.id}`);
    startTransition(async () => {
      try {
        const result = await approveRegistrationAction(registration.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Inscrição aprovada.");
        refresh();
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleReject(registration: TournamentRegistration) {
    setActiveAction(`reject-${registration.id}`);
    startTransition(async () => {
      try {
        const result = await rejectRegistrationAction(registration.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Inscrição rejeitada.");
        refresh();
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleRemove(registration: TournamentRegistration) {
    setActiveAction(`remove-${registration.id}`);
    startTransition(async () => {
      try {
        const result = await removeRegistrationAction(registration.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Inscrição removida.");
        refresh();
      } finally {
        setActiveAction(null);
      }
    });
  }

  function renderRowActions(registration: TournamentRegistration, teamName: string): ReactNode {
    if (registration.status === "PENDING") {
      return (
        <>
          <Button
            aria-label={`Aprovar inscrição de ${teamName}`}
            disabled={isPending}
            onClick={() => handleApprove(registration)}
            size="sm"
            variant="outline"
          >
            {activeAction === `approve-${registration.id}` ? <Loader2 className="animate-spin" /> : <Check />}
            Aprovar
          </Button>
          <Button
            aria-label={`Rejeitar inscrição de ${teamName}`}
            disabled={isPending}
            onClick={() => handleReject(registration)}
            size="sm"
            variant="destructive"
          >
            {activeAction === `reject-${registration.id}` ? <Loader2 className="animate-spin" /> : <X />}
            Rejeitar
          </Button>
          <Button
            aria-label={`Remover inscrição de ${teamName}`}
            disabled={isPending}
            onClick={() => handleRemove(registration)}
            size="sm"
            variant="ghost"
          >
            {activeAction === `remove-${registration.id}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Remover
          </Button>
        </>
      );
    }

    if (registration.status === "APPROVED") {
      return (
        <Button
          aria-label={`Remover inscrição de ${teamName}`}
          disabled={isPending}
          onClick={() => handleRemove(registration)}
          size="sm"
          variant="ghost"
        >
          <Trash2 /> Remover
        </Button>
      );
    }

    return null;
  }

  let registerArea: ReactNode;
  if (availableTeams.length === 0) {
    registerArea = (
      <p className="text-muted-foreground text-sm">
        {teams.length === 0 ? "Não há equipas registadas." : "Todas as equipas já estão inscritas."}
      </p>
    );
  } else {
    registerArea = (
      <div className="flex flex-wrap items-center gap-2">
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger aria-label="Equipa a inscrever" className="w-full sm:w-48" size="sm">
            <SelectValue placeholder="Selecione a equipa" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {availableTeams.map((team) => (
                <SelectItem key={team.id} value={String(team.id)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button disabled={isPending || loading || !teamId} onClick={handleRegister} size="sm">
          {activeAction === "register" ? <Loader2 className="animate-spin" /> : <Check />}
          Inscrever
        </Button>
      </div>
    );
  }

  let body: ReactNode;
  if (loading && !registrations) {
    body = (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-12 w-full rounded-xl" key={index} />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={refresh} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (!registrations || registrations.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>Sem inscrições</EmptyTitle>
          <EmptyDescription>As equipas inscritas aparecem aqui para aprovação.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    body = (
      <ul className="flex flex-col gap-1.5">
        {registrations.map((registration) => {
          const teamName = teamLabel(registration.teamId);
          return (
            <li
              key={registration.id}
              className="flex w-full flex-wrap items-center gap-3 rounded-xl border p-3 text-left"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                {getInitials(teamName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm leading-tight">{teamName}</div>
                {registration.rejectionReason ? (
                  <div className="truncate text-muted-foreground text-xs">{registration.rejectionReason}</div>
                ) : null}
              </div>

              <Badge variant={registrationStatusVariant(registration.status)}>
                {registrationStatusLabel(registration.status)}
              </Badge>

              <span className="hidden shrink-0 text-muted-foreground text-xs sm:block">
                {formatDate(registration.registeredAt)}
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {renderRowActions(registration, teamName)}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {registrations
            ? `${registrations.length} ${plural(registrations.length, "inscrição", "inscrições")}`
            : "—"}
        </p>
        {registerArea}
      </div>

      {body}
    </div>
  );
}
