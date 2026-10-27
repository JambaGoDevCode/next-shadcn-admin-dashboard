"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { Check, Gavel, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  Team,
  Tournament,
  TournamentFixture,
  TournamentIncident,
  TournamentIncidentStatus,
  TournamentIncidentType,
} from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { listFixturesAction } from "@/server/actions/championship-ops";
import { listTournamentsAction } from "@/server/actions/championships";
import { listTeamsAction } from "@/server/actions/management";
import {
  createTournamentIncidentAction,
  listTournamentIncidentsAction,
  updateTournamentIncidentAction,
} from "@/server/actions/tournament-incidents";

const INCIDENT_TYPES: { value: TournamentIncidentType; label: string }[] = [
  { value: "WITHDRAWAL", label: "Desistência" },
  { value: "CONFLICT", label: "Conflito" },
  { value: "CONTESTATION", label: "Contestação" },
  { value: "OTHER", label: "Outro" },
];

function incidentTypeLabel(type: TournamentIncidentType): string {
  return INCIDENT_TYPES.find((option) => option.value === type)?.label ?? type;
}

function incidentStatusLabel(status: TournamentIncidentStatus): string {
  if (status === "IN_REVIEW") return "Em análise";
  if (status === "RESOLVED") return "Resolvido";
  return "Aberto";
}

function incidentStatusVariant(status: TournamentIncidentStatus): "default" | "secondary" | "outline" {
  if (status === "RESOLVED") return "default";
  if (status === "IN_REVIEW") return "secondary";
  return "outline";
}

function fixtureLabel(fixtureId: number, fixtures: TournamentFixture[], teams: Team[]): string {
  const fixture = fixtures.find((row) => row.id === fixtureId);
  if (!fixture) return `Jogo #${fixtureId}`;

  const homeTeam = teams.find((team) => team.id === fixture.homeTeamId)?.name ?? `Equipa #${fixture.homeTeamId}`;
  const awayTeam = teams.find((team) => team.id === fixture.awayTeamId)?.name ?? `Equipa #${fixture.awayTeamId}`;
  return `${homeTeam} vs ${awayTeam}`;
}

export function ChampionshipIncidentsAdmin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [incidents, setIncidents] = useState<TournamentIncident[]>([]);
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<TournamentIncidentType>("CONTESTATION");
  const [fixtureId, setFixtureId] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resolvingIncident, setResolvingIncident] = useState<TournamentIncident | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    listTournamentsAction()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setTournaments(result.data);
        setSelectedTournamentId((current) => current || String(result.data[0]?.id ?? ""));
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os torneios.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTournaments(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) {
      setIncidents([]);
      setFixtures([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    const tournamentId = Number(selectedTournamentId);

    Promise.all([listTournamentIncidentsAction(tournamentId), listFixturesAction(tournamentId), listTeamsAction()])
      .then(([incidentResult, fixtureResult, teamResult]) => {
        if (cancelled) return;
        if (!incidentResult.ok) {
          setError(incidentResult.error);
          return;
        }
        if (!fixtureResult.ok) {
          setError(fixtureResult.error);
          return;
        }
        if (!teamResult.ok) {
          setError(teamResult.error);
          return;
        }
        setIncidents(incidentResult.data);
        setFixtures(fixtureResult.data);
        setTeams(teamResult.data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os incidentes do torneio.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTournamentId]);

  function submitIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTournamentId) return;
    startTransition(async () => {
      const result = await createTournamentIncidentAction({
        tournamentId: Number(selectedTournamentId),
        fixtureId: fixtureId === "none" ? null : Number(fixtureId),
        type: incidentType,
        title: title.trim(),
        description: description.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Incidente registado.");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setFixtureId("none");
      refresh();
    });
  }

  function changeStatus(incidentId: number, status: TournamentIncidentStatus, note?: string) {
    startTransition(async () => {
      const result = await updateTournamentIncidentAction(incidentId, { status, resolutionNote: note });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(status === "RESOLVED" ? "Incidente resolvido." : "Incidente encaminhado para análise.");
      setResolvingIncident(null);
      setResolutionNote("");
      refresh();
    });
  }

  const selectedTournament = tournaments.find((tournament) => String(tournament.id) === selectedTournamentId);

  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Incidentes</CardTitle>
          <CardDescription>
            Registe desistências, conflitos e contestações, acompanhe a análise e documente a resolução.
          </CardDescription>
        </div>
        <CardAction className="flex gap-2">
          <Button
            aria-label="Recarregar incidentes"
            disabled={loading || loadingTournaments}
            onClick={refresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          <Button disabled={!selectedTournamentId} onClick={() => setCreateOpen(true)} size="sm">
            <Plus data-icon="inline-start" />
            Registar incidente
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select onValueChange={setSelectedTournamentId} value={selectedTournamentId}>
            <SelectTrigger aria-label="Selecionar torneio" className="w-full sm:w-80" disabled={loadingTournaments}>
              <SelectValue placeholder="Selecione um torneio" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={String(tournament.id)}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {selectedTournament && <Badge variant="outline">{selectedTournament.status}</Badge>}
        </div>

        {loadingTournaments || loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-12 w-full" key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button className="mx-auto" onClick={refresh} size="sm" variant="outline">
              Tentar novamente
            </Button>
          </div>
        ) : incidents.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Gavel />
              </EmptyMedia>
              <EmptyTitle>Sem incidentes registados</EmptyTitle>
              <EmptyDescription>Os casos relacionados com este torneio aparecerão aqui.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incidente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="min-w-64">
                      <p className="font-medium">{incident.title}</p>
                      <p className="line-clamp-2 text-muted-foreground text-xs">{incident.description}</p>
                      {incident.resolutionNote && <p className="mt-1 text-xs">Resolução: {incident.resolutionNote}</p>}
                    </TableCell>
                    <TableCell>{incidentTypeLabel(incident.type)}</TableCell>
                    <TableCell>
                      {incident.fixtureId ? fixtureLabel(incident.fixtureId, fixtures, teams) : "Geral"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={incidentStatusVariant(incident.status)}>
                        {incidentStatusLabel(incident.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(incident.createdAt)}</TableCell>
                    <TableCell>
                      {incident.status === "OPEN" && (
                        <Button
                          disabled={pending}
                          onClick={() => changeStatus(incident.id, "IN_REVIEW")}
                          size="sm"
                          variant="outline"
                        >
                          Em análise
                        </Button>
                      )}
                      {incident.status !== "RESOLVED" && (
                        <Button
                          className="ml-1"
                          disabled={pending}
                          onClick={() => setResolvingIncident(incident)}
                          size="sm"
                        >
                          <Check data-icon="inline-start" />
                          Resolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar incidente</DialogTitle>
            <DialogDescription>
              Associe o caso ao torneio e descreva os factos para manter o registo operacional.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitIncident}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="incident-type">Tipo</FieldLabel>
                <Select
                  onValueChange={(value) => {
                    const selected = INCIDENT_TYPES.find((option) => option.value === value);
                    if (selected) setIncidentType(selected.value);
                  }}
                  value={incidentType}
                >
                  <SelectTrigger id="incident-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {INCIDENT_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="incident-fixture">Jogo associado</FieldLabel>
                <Select onValueChange={setFixtureId} value={fixtureId}>
                  <SelectTrigger id="incident-fixture" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Sem jogo específico</SelectItem>
                      {fixtures.map((fixture) => (
                        <SelectItem key={fixture.id} value={String(fixture.id)}>
                          {fixtureLabel(fixture.id, fixtures, teams)} · {fixture.homeScore ?? "—"}–
                          {fixture.awayScore ?? "—"}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="incident-title">Título</FieldLabel>
                <Input
                  id="incident-title"
                  maxLength={180}
                  minLength={3}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  value={title}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="incident-description">Descrição dos factos</FieldLabel>
                <Textarea
                  id="incident-description"
                  maxLength={10000}
                  minLength={10}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  value={description}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button onClick={() => setCreateOpen(false)} type="button" variant="outline">
                Cancelar
              </Button>
              <Button disabled={pending} type="submit">
                Guardar incidente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setResolvingIncident(null);
            setResolutionNote("");
          }
        }}
        open={resolvingIncident !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver incidente</DialogTitle>
            <DialogDescription>
              A resolução fica registada com a conta administrativa e não pode ser alterada depois de concluída.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="incident-resolution">Justificação da resolução</FieldLabel>
            <Textarea
              id="incident-resolution"
              maxLength={10000}
              minLength={3}
              onChange={(event) => setResolutionNote(event.target.value)}
              required
              value={resolutionNote}
            />
          </Field>
          <DialogFooter>
            <Button onClick={() => setResolvingIncident(null)} variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={pending || resolutionNote.trim().length < 3 || !resolvingIncident}
              onClick={() => resolvingIncident && changeStatus(resolvingIncident.id, "RESOLVED", resolutionNote)}
            >
              Resolver caso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
