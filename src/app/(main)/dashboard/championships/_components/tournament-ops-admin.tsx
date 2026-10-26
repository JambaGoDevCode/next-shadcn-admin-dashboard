"use client";

import { type ReactNode, useCallback, useEffect, useState, useTransition } from "react";

import {
  Activity,
  Award,
  Banknote,
  CalendarDays,
  ClipboardList,
  Gavel,
  History,
  Layers,
  ListOrdered,
  Loader2,
  Plus,
  RefreshCw,
  Trophy,
} from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  Player,
  Team,
  Tournament,
  TournamentAward,
  TournamentDiscipline,
  TournamentFixture,
  TournamentHistory,
  TournamentPayment,
  TournamentPlayerStats,
  TournamentRegistration,
  TournamentStage,
  TournamentTeamStats,
  TournamentTopAssist,
  TournamentTopScorer,
} from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  advanceStageAction,
  applyPenaltyAction,
  assignAwardAction,
  calculateAwardsAction,
  confirmPaymentAction,
  createPaymentAction,
  createStageAction,
  deleteAwardAction,
  deleteDisciplineAction,
  deleteFixtureAction,
  deleteStageAction,
  generateFixturesAction,
  getChampionHistoriesAction,
  getPlayerStatsAction,
  getTeamStatsAction,
  getTopAssistsAction,
  getTopScorersAction,
  getTournamentHistoryAction,
  liftSuspensionAction,
  listAwardsAction,
  listDisciplineReportAction,
  listFixturesAction,
  listPaymentsByTournamentAction,
  listStagesAction,
  recordHistoryAction,
  refundPaymentAction,
  registerCardAction,
  suspendPlayerAction,
  updateAwardAction,
  updateFixtureResultAction,
  updateStageAction,
} from "@/server/actions/championship-ops";
import { listRegistrationsAction, listTournamentsAction } from "@/server/actions/championships";
import { listTeamsAction } from "@/server/actions/management";
import { listPlayersAction } from "@/server/actions/players";

import { ChampionshipRegistrationsCard } from "./championship-registrations-card";
import { ChampionshipStandingsCard } from "./championship-standings-card";
import { TournamentSelector } from "./tournament-selector";

export type TournamentOpsSection =
  | "registrations"
  | "standings"
  | "stages"
  | "fixtures"
  | "awards"
  | "disciplines"
  | "payments"
  | "histories"
  | "statistics";

const SECTION_META: Record<TournamentOpsSection, { title: string; description: string; icon: typeof Trophy }> = {
  registrations: { title: "Inscrições", description: "Registe equipas e acompanhe aprovações.", icon: ClipboardList },
  standings: {
    title: "Classificações",
    description: "Calcule e consulte a classificação do campeonato.",
    icon: ListOrdered,
  },
  stages: { title: "Fases", description: "Configure as fases e acompanhe a progressão.", icon: Layers },
  fixtures: { title: "Jogos", description: "Gere calendários e registe resultados.", icon: CalendarDays },
  awards: { title: "Prémios", description: "Calcule, atribua e mantenha os prémios do campeonato.", icon: Award },
  disciplines: { title: "Disciplinas", description: "Registe cartões, suspensões e penalizações.", icon: Gavel },
  payments: {
    title: "Pagamentos",
    description: "Crie cobranças e acompanhe liquidações e reembolsos.",
    icon: Banknote,
  },
  histories: {
    title: "Históricos",
    description: "Consulte e registe snapshots de campeonatos concluídos.",
    icon: History,
  },
  statistics: { title: "Estatísticas", description: "Consulte os principais indicadores individuais.", icon: Activity },
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
type FieldOption = { label: string; value: string };
type FormField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "multiselect";
  options?: FieldOption[];
  required?: boolean;
  defaultValue?: string | string[];
};
type FormValues = Record<string, string | string[]>;

function teamOptions(teams: Team[]): FieldOption[] {
  return teams.map((team) => ({ label: team.name, value: String(team.id) }));
}

function playerOptions(players: Player[]): FieldOption[] {
  return players.map((player) => ({ label: player.fullName, value: player.id }));
}

function teamName(teams: Team[], id?: number | null): string {
  return teams.find((team) => team.id === id)?.name ?? (id ? `Equipa #${id}` : "—");
}

function playerName(players: Player[], id?: string | null): string {
  return players.find((player) => player.id === id)?.fullName ?? (id ? `Jogador ${id}` : "—");
}

function paymentStatusVariant(status: unknown): "default" | "destructive" | "outline" {
  if (status === "PAID") return "default";
  if (status === "FAILED") return "destructive";
  return "outline";
}

function formString(values: FormValues, name: string): string {
  const value = values[name];
  return Array.isArray(value) ? value.join(",") : (value ?? "");
}

function FormDialog({
  fields,
  onSubmit,
  title,
  triggerLabel,
}: {
  fields: FormField[];
  onSubmit: (values: FormValues) => Promise<boolean>;
  title: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({});
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const defaults = Object.fromEntries(
      fields
        .filter((field) => field.defaultValue !== undefined)
        .map((field) => [field.name, field.defaultValue as string | string[]]),
    );
    startTransition(async () => {
      if (await onSubmit({ ...defaults, ...values })) {
        setOpen(false);
        setValues({});
      }
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus /> {triggerLabel}
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preencha os dados para continuar.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {fields.map((field) => {
            const value = values[field.name] ?? field.defaultValue ?? "";
            const id = `tournament-${field.name}`;
            if (field.type === "select") {
              return (
                <Field key={field.name}>
                  <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                  <Select
                    onValueChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
                    value={String(value)}
                  >
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              );
            }
            if (field.type === "multiselect") {
              const selected = Array.isArray(value) ? value : [];
              return (
                <Field key={field.name}>
                  <Label htmlFor={id}>{field.label}</Label>
                  <select
                    className="min-h-32 w-full rounded-lg border border-input bg-background p-2 text-sm"
                    id={id}
                    multiple
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.name]: Array.from(event.currentTarget.selectedOptions, (option) => option.value),
                      }))
                    }
                    value={selected}
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            }
            if (field.type === "textarea") {
              return (
                <Field key={field.name}>
                  <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                  <Textarea
                    id={id}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    required={field.required}
                    value={String(value)}
                  />
                </Field>
              );
            }
            return (
              <Field key={field.name}>
                <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                <Input
                  id={id}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  required={field.required}
                  type={field.type ?? "text"}
                  value={String(value)}
                />
              </Field>
            );
          })}
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={pending} type="submit">
              {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmButton({
  children,
  description,
  onConfirm,
  variant = "outline",
}: {
  children: ReactNode;
  description: string;
  onConfirm: () => void;
  variant?: "outline" | "destructive";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={variant}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar ação?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DataTable({
  columns,
  rows,
  emptyTitle = "Sem registos",
  emptyDescription = "Ainda não existem dados para este campeonato.",
}: {
  columns: { key: string; label: string; render: (row: Record<string, unknown>) => ReactNode }[];
  rows: Record<string, unknown>[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!rows.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={String(row.id ?? row.stageId ?? row.playerId ?? index)}>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TournamentOpsAdmin({ section }: { section: TournamentOpsSection }) {
  const meta = SECTION_META[section];
  const Icon = meta.icon;
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const [stages, setStages] = useState<TournamentStage[]>([]);
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [awards, setAwards] = useState<TournamentAward[]>([]);
  const [disciplines, setDisciplines] = useState<TournamentDiscipline[]>([]);
  const [payments, setPayments] = useState<TournamentPayment[]>([]);
  const [histories, setHistories] = useState<TournamentHistory[]>([]);
  const [scorers, setScorers] = useState<TournamentTopScorer[]>([]);
  const [assists, setAssists] = useState<TournamentTopAssist[]>([]);
  const [teamStats, setTeamStats] = useState<TournamentTeamStats | null>(null);
  const [playerStats, setPlayerStats] = useState<TournamentPlayerStats | null>(null);
  const [statsTeamId, setStatsTeamId] = useState("");
  const [statsPlayerId, setStatsPlayerId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingRefs(true);
    Promise.all([listTournamentsAction(), listTeamsAction(), listPlayersAction()])
      .then(([t, tm, pl]) => {
        if (cancelled) return;
        if (!t.ok) toast.error(t.error);
        if (!tm.ok) toast.error(tm.error);
        if (!pl.ok) toast.error(pl.error);
        const tournamentsData = t.ok ? t.data : [];
        setTournaments(tournamentsData);
        setTeams(tm.ok ? tm.data : []);
        setPlayers(pl.ok ? pl.data : []);
        setSelectedId((current) => current ?? tournamentsData[0]?.id ?? null);
        setLoadingRefs(false);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Não foi possível carregar os dados de referência.");
          setLoadingRefs(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    void refreshKey;
    let cancelled = false;
    if (selectedId === null) {
      setRegistrations([]);
      return;
    }
    listRegistrationsAction(selectedId)
      .then((result) => {
        if (!cancelled) setRegistrations(result.ok ? result.data : []);
      })
      .catch(() => {
        if (!cancelled) setRegistrations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, refreshKey]);

  useEffect(() => {
    void refreshKey;
    let cancelled = false;
    if (section === "histories" && selectedId === null) {
      setLoading(true);
      void getChampionHistoriesAction()
        .then((result) => {
          if (cancelled) return;
          if (result.ok) {
            setHistories(result.data);
            setError(null);
          } else {
            setError(result.error);
            setHistories([]);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Não foi possível carregar os históricos.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    if (selectedId === null || section === "registrations" || section === "standings") return;
    setLoading(true);
    setError(null);
    const load = async () => {
      let result: ActionResult<unknown> | null = null;
      switch (section) {
        case "stages":
          result = await listStagesAction(selectedId);
          if (result.ok) setStages(result.data as TournamentStage[]);
          break;
        case "fixtures":
          result = await listFixturesAction(selectedId);
          if (result.ok) setFixtures(result.data as TournamentFixture[]);
          break;
        case "awards":
          result = await listAwardsAction(selectedId);
          if (result.ok) setAwards(result.data as TournamentAward[]);
          break;
        case "disciplines":
          result = await listDisciplineReportAction(selectedId);
          if (result.ok) setDisciplines(result.data as TournamentDiscipline[]);
          break;
        case "payments":
          result = await listPaymentsByTournamentAction(selectedId);
          if (result.ok) setPayments(result.data as TournamentPayment[]);
          break;
        case "histories": {
          const [historyResult, championsResult] = await Promise.all([
            getTournamentHistoryAction(selectedId),
            getChampionHistoriesAction(),
          ]);
          if (!historyResult.ok) result = historyResult;
          else if (!championsResult.ok) result = championsResult;
          else {
            const combined = [...championsResult.data];
            if (historyResult.data && !combined.some((history) => history.id === historyResult.data?.id))
              combined.unshift(historyResult.data);
            setHistories(combined);
          }
          break;
        }
        case "statistics": {
          const [scorerResult, assistResult] = await Promise.all([
            getTopScorersAction(selectedId),
            getTopAssistsAction(selectedId),
          ]);
          if (!scorerResult.ok) result = scorerResult;
          else if (!assistResult.ok) result = assistResult;
          else {
            setScorers(scorerResult.data);
            setAssists(assistResult.data);
          }
          break;
        }
      }
      if (cancelled) return;
      if (result && !result.ok) setError(result.error);
      setLoading(false);
    };
    load().catch(() => {
      if (!cancelled) {
        setError("Não foi possível carregar os dados do campeonato.");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [section, selectedId, refreshKey]);

  const runAction = useCallback(
    async <T,>(action: Promise<ActionResult<T>>, successMessage: string): Promise<boolean> => {
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      toast.success(successMessage);
      refresh();
      return true;
    },
    [refresh],
  );

  function confirmedAction(action: () => Promise<ActionResult<unknown>>, success: string) {
    startTransition(async () => {
      await runAction(action(), success);
    });
  }

  const activeTournament = tournaments.find((tournament) => tournament.id === selectedId);
  const registeredTeams = teams.filter((team) =>
    registrations.some(
      (registration) => registration.teamId === team.id && !["REJECTED", "REMOVED"].includes(registration.status),
    ),
  );
  const approvedTeams = registeredTeams.filter((team) =>
    registrations.some((registration) => registration.teamId === team.id && registration.status === "APPROVED"),
  );
  const refreshButton = (
    <Button
      aria-label="Recarregar dados"
      disabled={loading || pending}
      onClick={refresh}
      size="icon-sm"
      variant="ghost"
    >
      <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
    </Button>
  );

  function handleTeamStatsChange(value: string) {
    setStatsTeamId(value);
    setTeamStats(null);
    if (!value || selectedId === null) return;
    startTransition(async () => {
      const result = await getTeamStatsAction(selectedId, Number(value));
      if (!result.ok) toast.error(result.error);
      else setTeamStats(result.data);
    });
  }

  function handlePlayerStatsChange(value: string) {
    setStatsPlayerId(value);
    setPlayerStats(null);
    if (!value || selectedId === null) return;
    startTransition(async () => {
      const result = await getPlayerStatsAction(selectedId, value);
      if (!result.ok) toast.error(result.error);
      else setPlayerStats(result.data);
    });
  }

  let content: ReactNode;
  if (loadingRefs || (loading && !activeTournament && section !== "histories")) {
    content = <Skeleton className="h-56 w-full" />;
  } else if (error) {
    content = (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="mb-3 text-destructive text-sm">{error}</p>
        <Button onClick={refresh} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (section !== "histories" && !activeTournament) {
    content = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trophy />
          </EmptyMedia>
          <EmptyTitle>Nenhum campeonato disponível</EmptyTitle>
          <EmptyDescription>Crie um campeonato na secção principal antes de gerir este módulo.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else if (section === "registrations" && selectedId) {
    content = <ChampionshipRegistrationsCard key={selectedId} teams={teams} tournamentId={selectedId} />;
  } else if (section === "standings" && selectedId) {
    content = <ChampionshipStandingsCard key={selectedId} teams={teams} tournamentId={selectedId} />;
  } else if (section === "stages" && selectedId) {
    const fields: FormField[] = [
      { name: "name", label: "Nome", required: true },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        required: true,
        defaultValue: "LEAGUE",
        options: [
          "GROUP",
          "LEAGUE",
          "ROUND_ROBIN",
          "KNOCKOUT",
          "QUARTER_FINAL",
          "SEMI_FINAL",
          "FINAL",
          "THIRD_PLACE",
          "SWISS",
        ].map((value) => ({ label: value, value })),
      },
      { name: "order", label: "Ordem", type: "number", required: true, defaultValue: String(stages.length + 1) },
      { name: "matchesPerTeam", label: "Jogos por equipa", type: "number", required: true, defaultValue: "1" },
      { name: "qualifiedTeams", label: "Equipas qualificadas", type: "number", required: true, defaultValue: "2" },
    ];
    content = (
      <>
        <div className="mb-4 flex justify-end">
          <FormDialog
            fields={fields}
            onSubmit={(values) =>
              runAction(
                createStageAction({
                  tournamentId: selectedId,
                  name: formString(values, "name"),
                  type: formString(values, "type") || "LEAGUE",
                  order: Number(formString(values, "order")),
                  rule: {
                    matchesPerTeam: Number(formString(values, "matchesPerTeam")),
                    qualifiedTeams: Number(formString(values, "qualifiedTeams")),
                    elimination: formString(values, "type") === "KNOCKOUT",
                    homeAndAway: false,
                    pointsForWin: 3,
                    pointsForDraw: 1,
                    pointsForLoss: 0,
                    allowDraw: true,
                  },
                }),
                "Fase criada.",
              )
            }
            title="Nova fase"
            triggerLabel="Nova fase"
          />
        </div>
        <DataTable
          rows={stages as unknown as Record<string, unknown>[]}
          columns={[
            { key: "name", label: "Fase", render: (row) => <span className="font-medium">{String(row.name)}</span> },
            { key: "type", label: "Tipo", render: (row) => String(row.type) },
            { key: "order", label: "Ordem", render: (row) => String(row.order) },
            { key: "status", label: "Estado", render: (row) => <Badge variant="outline">{String(row.status)}</Badge> },
            {
              key: "actions",
              label: "Ações",
              render: (row) => {
                const stage = row as unknown as TournamentStage;
                return (
                  <div className="flex gap-1">
                    <Button
                      disabled={pending || stage.status === "COMPLETED"}
                      onClick={() => confirmedAction(() => advanceStageAction(stage.stageId), "Fase avançada.")}
                      size="sm"
                      variant="outline"
                    >
                      Avançar
                    </Button>
                    <FormDialog
                      fields={[
                        { name: "name", label: "Nome", required: true, defaultValue: stage.name },
                        {
                          name: "matchesPerTeam",
                          label: "Jogos por equipa",
                          type: "number",
                          defaultValue: String(stage.rule?.matchesPerTeam ?? 1),
                        },
                        {
                          name: "qualifiedTeams",
                          label: "Equipas qualificadas",
                          type: "number",
                          defaultValue: String(stage.rule?.qualifiedTeams ?? 2),
                        },
                      ]}
                      onSubmit={(values) =>
                        runAction(
                          updateStageAction(stage.stageId, {
                            name: formString(values, "name"),
                            rule: stage.rule
                              ? {
                                  ...stage.rule,
                                  matchesPerTeam: Number(formString(values, "matchesPerTeam")),
                                  qualifiedTeams: Number(formString(values, "qualifiedTeams")),
                                }
                              : undefined,
                          }),
                          "Fase atualizada.",
                        )
                      }
                      title="Editar fase"
                      triggerLabel="Editar"
                    />
                    <ConfirmButton
                      description="A fase será eliminada permanentemente."
                      onConfirm={() => confirmedAction(() => deleteStageAction(stage.stageId), "Fase eliminada.")}
                      variant="destructive"
                    >
                      Eliminar
                    </ConfirmButton>
                  </div>
                );
              },
            },
          ]}
        />
      </>
    );
  } else if (section === "fixtures" && selectedId) {
    const fixtureForm: FormField[] = [
      {
        name: "teamIds",
        label: "Equipas participantes",
        type: "multiselect",
        options: teamOptions(approvedTeams),
        required: true,
      },
    ];
    content = (
      <>
        <div className="mb-4 flex justify-end">
          <FormDialog
            fields={fixtureForm}
            onSubmit={(values) => {
              const teamIds = Array.isArray(values.teamIds) ? values.teamIds.map(Number) : [];
              if (teamIds.length < 2) {
                toast.error("Selecione pelo menos duas equipas.");
                return Promise.resolve(false);
              }
              return runAction(generateFixturesAction({ tournamentId: selectedId, teamIds }), "Calendário gerado.");
            }}
            title="Gerar jogos"
            triggerLabel={fixtures.length ? "Regenerar jogos" : "Gerar jogos"}
          />
        </div>
        <DataTable
          rows={fixtures as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "match",
              label: "Jogo",
              render: (row) => (
                <span className="font-medium">
                  {teamName(teams, Number(row.homeTeamId))} · {teamName(teams, Number(row.awayTeamId))}
                </span>
              ),
            },
            { key: "type", label: "Tipo", render: (row) => String(row.type) },
            {
              key: "result",
              label: "Resultado",
              render: (row) =>
                row.isPlayed ? (
                  `${row.homeScore ?? 0} – ${row.awayScore ?? 0}`
                ) : (
                  <Badge variant="outline">Por jogar</Badge>
                ),
            },
            {
              key: "actions",
              label: "Ações",
              render: (row) => {
                const fixture = row as unknown as TournamentFixture;
                return (
                  <div className="flex gap-1">
                    <FormDialog
                      fields={[
                        {
                          name: "homeScore",
                          label: `Golos ${teamName(teams, fixture.homeTeamId)}`,
                          type: "number",
                          required: true,
                          defaultValue: String(fixture.homeScore ?? 0),
                        },
                        {
                          name: "awayScore",
                          label: `Golos ${teamName(teams, fixture.awayTeamId)}`,
                          type: "number",
                          required: true,
                          defaultValue: String(fixture.awayScore ?? 0),
                        },
                      ]}
                      onSubmit={(values) =>
                        runAction(
                          updateFixtureResultAction(fixture.id, {
                            homeScore: Number(formString(values, "homeScore")),
                            awayScore: Number(formString(values, "awayScore")),
                          }),
                          "Resultado registado.",
                        )
                      }
                      title="Registar resultado"
                      triggerLabel="Resultado"
                    />
                    <ConfirmButton
                      description="O jogo será removido do calendário."
                      onConfirm={() => confirmedAction(() => deleteFixtureAction(fixture.id), "Jogo eliminado.")}
                      variant="destructive"
                    >
                      Eliminar
                    </ConfirmButton>
                  </div>
                );
              },
            },
          ]}
        />
      </>
    );
  } else if (section === "awards" && selectedId) {
    const awardFields: FormField[] = [
      {
        name: "awardId",
        label: "Prémio",
        type: "select",
        required: true,
        options: awards.map((award) => ({ label: `${award.type} · #${award.id}`, value: String(award.id) })),
      },
      {
        name: "playerId",
        label: "Jogador",
        type: "select",
        options: [{ label: "Sem jogador", value: "none" }, ...playerOptions(players)],
      },
      {
        name: "teamId",
        label: "Equipa",
        type: "select",
        options: [{ label: "Sem equipa", value: "none" }, ...teamOptions(teams)],
      },
      { name: "description", label: "Descrição", type: "textarea" },
    ];
    content = (
      <>
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Button
            disabled={pending}
            onClick={() => confirmedAction(() => calculateAwardsAction(selectedId), "Prémios calculados.")}
            size="sm"
            variant="outline"
          >
            Calcular prémios
          </Button>
          <FormDialog
            fields={awardFields}
            onSubmit={(values) => {
              const awardId = Number(formString(values, "awardId"));
              if (!awardId) {
                toast.error("Selecione um prémio.");
                return Promise.resolve(false);
              }
              return runAction(
                updateAwardAction(awardId, {
                  playerId:
                    formString(values, "playerId") === "none" ? null : formString(values, "playerId") || undefined,
                  teamId:
                    formString(values, "teamId") === "none" ? null : Number(formString(values, "teamId")) || undefined,
                  description: formString(values, "description") || undefined,
                }),
                "Prémio atualizado.",
              );
            }}
            title="Editar prémio"
            triggerLabel="Editar atribuição"
          />
        </div>
        <DataTable
          rows={awards as unknown as Record<string, unknown>[]}
          columns={[
            { key: "type", label: "Prémio", render: (row) => <span className="font-medium">{String(row.type)}</span> },
            {
              key: "recipient",
              label: "Atribuído a",
              render: (row) =>
                playerName(players, row.playerId == null ? null : String(row.playerId)) !== "—"
                  ? playerName(players, row.playerId == null ? null : String(row.playerId))
                  : teamName(teams, row.teamId as number | null),
            },
            { key: "position", label: "Posição", render: (row) => String(row.position ?? "—") },
            { key: "description", label: "Descrição", render: (row) => String(row.description ?? "—") },
            {
              key: "actions",
              label: "Ações",
              render: (row) => {
                const award = row as unknown as TournamentAward;
                return (
                  <div className="flex gap-1">
                    <Button
                      disabled={pending || Boolean(award.assignedAt)}
                      onClick={() => confirmedAction(() => assignAwardAction(award.id), "Prémio atribuído.")}
                      size="sm"
                      variant="outline"
                    >
                      Atribuir
                    </Button>
                    <ConfirmButton
                      description="O prémio será eliminado."
                      onConfirm={() => confirmedAction(() => deleteAwardAction(award.id), "Prémio eliminado.")}
                      variant="destructive"
                    >
                      Eliminar
                    </ConfirmButton>
                  </div>
                );
              },
            },
          ]}
        />
      </>
    );
  } else if (section === "disciplines" && selectedId) {
    const disciplineFields: FormField[] = [
      {
        name: "kind",
        label: "Registo",
        type: "select",
        required: true,
        defaultValue: "CARD",
        options: [
          { label: "Cartão", value: "CARD" },
          { label: "Suspensão", value: "SUSPENSION" },
          { label: "Penalização", value: "PENALTY" },
        ],
      },
      {
        name: "playerId",
        label: "Jogador",
        type: "select",
        options: [{ label: "Sem jogador", value: "none" }, ...playerOptions(players)],
      },
      { name: "teamId", label: "Equipa", type: "select", required: true, options: teamOptions(teams) },
      {
        name: "cardType",
        label: "Cartão",
        type: "select",
        defaultValue: "YELLOW",
        options: [
          { label: "Amarelo", value: "YELLOW" },
          { label: "Vermelho", value: "RED" },
        ],
      },
      { name: "minute", label: "Minuto", type: "number" },
      { name: "matches", label: "Jogos de suspensão", type: "number", defaultValue: "1" },
      { name: "amount", label: "Valor da penalização", type: "number" },
      { name: "reason", label: "Motivo", type: "textarea", required: true },
    ];
    content = (
      <>
        <div className="mb-4 flex justify-end">
          <FormDialog
            fields={disciplineFields}
            onSubmit={(values) => {
              const kind = formString(values, "kind");
              const playerId = formString(values, "playerId");
              const teamId = Number(formString(values, "teamId"));
              const reason = formString(values, "reason");
              if (kind === "CARD")
                return runAction(
                  registerCardAction({
                    tournamentId: selectedId,
                    teamId,
                    playerId: playerId && playerId !== "none" ? playerId : undefined,
                    cardType: formString(values, "cardType") === "RED" ? "RED" : "YELLOW",
                    minute: Number(formString(values, "minute")) || undefined,
                    reason: reason || undefined,
                  }),
                  "Cartão registado.",
                );
              if (kind === "SUSPENSION") {
                if (!playerId || playerId === "none") {
                  toast.error("Selecione um jogador para a suspensão.");
                  return Promise.resolve(false);
                }
                return runAction(
                  suspendPlayerAction({
                    tournamentId: selectedId,
                    playerId,
                    matches: Number(formString(values, "matches")),
                    reason,
                  }),
                  "Suspensão registada.",
                );
              }
              return runAction(
                applyPenaltyAction({
                  tournamentId: selectedId,
                  playerId: playerId && playerId !== "none" ? playerId : undefined,
                  teamId,
                  amount: Number(formString(values, "amount")) || undefined,
                  reason,
                }),
                "Penalização registada.",
              );
            }}
            title="Novo registo disciplinar"
            triggerLabel="Novo registo"
          />
        </div>
        <DataTable
          rows={disciplines as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "type",
              label: "Tipo",
              render: (row) => (
                <Badge variant="outline">
                  {String(row.type)}
                  {row.cardType ? ` · ${row.cardType}` : ""}
                </Badge>
              ),
            },
            {
              key: "person",
              label: "Jogador / equipa",
              render: (row) => (
                <>
                  {playerName(players, row.playerId as string | null)}
                  <span className="text-muted-foreground"> · {teamName(teams, row.teamId as number | null)}</span>
                </>
              ),
            },
            { key: "reason", label: "Motivo", render: (row) => (row.reason ? String(row.reason) : "—") },
            {
              key: "status",
              label: "Estado",
              render: (row) => (
                <Badge variant={row.active ? "destructive" : "secondary"}>{row.active ? "Ativo" : "Resolvido"}</Badge>
              ),
            },
            {
              key: "actions",
              label: "Ações",
              render: (row) => {
                const item = row as unknown as TournamentDiscipline;
                return (
                  <div className="flex gap-1">
                    {item.type === "SUSPENSION" && item.active && item.playerId ? (
                      <Button
                        disabled={pending}
                        onClick={() =>
                          confirmedAction(
                            () =>
                              liftSuspensionAction({
                                disciplineId: item.id,
                                tournamentId: selectedId,
                                playerId: item.playerId as string,
                              }),
                            "Suspensão levantada.",
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        Levantar
                      </Button>
                    ) : null}
                    <ConfirmButton
                      description="O registo disciplinar será eliminado."
                      onConfirm={() => confirmedAction(() => deleteDisciplineAction(item.id), "Registo eliminado.")}
                      variant="destructive"
                    >
                      Eliminar
                    </ConfirmButton>
                  </div>
                );
              },
            },
          ]}
        />
      </>
    );
  } else if (section === "payments" && selectedId) {
    const paymentFields: FormField[] = [
      {
        name: "teamId",
        label: "Equipa inscrita",
        type: "select",
        required: true,
        options: teamOptions(registeredTeams),
      },
      { name: "registrationId", label: "ID da inscrição (opcional)", type: "number" },
    ];
    content = (
      <>
        <div className="mb-4 flex justify-end">
          <FormDialog
            fields={paymentFields}
            onSubmit={(values) =>
              runAction(
                createPaymentAction({
                  tournamentId: selectedId,
                  teamId: Number(formString(values, "teamId")),
                  registrationId: Number(formString(values, "registrationId")) || undefined,
                }),
                "Pagamento criado.",
              )
            }
            title="Criar pagamento"
            triggerLabel="Novo pagamento"
          />
        </div>
        <DataTable
          rows={payments as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "team",
              label: "Equipa",
              render: (row) => <span className="font-medium">{teamName(teams, Number(row.teamId))}</span>,
            },
            { key: "type", label: "Tipo", render: (row) => String(row.type ?? "Inscrição") },
            {
              key: "amount",
              label: "Valor",
              render: (row) =>
                row.amount == null
                  ? "—"
                  : `${Number(row.amount).toLocaleString("pt-PT")} ${String(row.currency ?? "EUR")}`,
            },
            {
              key: "status",
              label: "Estado",
              render: (row) => <Badge variant={paymentStatusVariant(row.status)}>{String(row.status)}</Badge>,
            },
            { key: "reference", label: "Referência", render: (row) => String(row.reference ?? "—") },
            {
              key: "actions",
              label: "Ações",
              render: (row) => {
                const payment = row as unknown as TournamentPayment;
                return (
                  <div className="flex gap-1">
                    {payment.status !== "PAID" && (
                      <Button
                        disabled={pending}
                        onClick={() => confirmedAction(() => confirmPaymentAction(payment.id), "Pagamento confirmado.")}
                        size="sm"
                        variant="outline"
                      >
                        Confirmar
                      </Button>
                    )}
                    {payment.status === "PAID" && (
                      <ConfirmButton
                        description="Será solicitado o reembolso deste pagamento."
                        onConfirm={() => confirmedAction(() => refundPaymentAction(payment.id), "Reembolso registado.")}
                        variant="destructive"
                      >
                        Reembolsar
                      </ConfirmButton>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      </>
    );
  } else if (section === "histories") {
    content = (
      <>
        {selectedId ? (
          <div className="mb-4 flex justify-end">
            <ConfirmButton
              description="Será criado um snapshot permanente dos resultados e prémios atuais."
              onConfirm={() => confirmedAction(() => recordHistoryAction(selectedId), "Histórico registado.")}
            >
              Registar histórico
            </ConfirmButton>
          </div>
        ) : null}
        <DataTable
          rows={histories as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "tournament",
              label: "Campeonato",
              render: (row) => (
                <span className="font-medium">{String(row.tournamentName ?? `Campeonato #${row.tournamentId}`)}</span>
              ),
            },
            { key: "type", label: "Tipo", render: (row) => String(row.tournamentType ?? "—") },
            {
              key: "champion",
              label: "Campeão",
              render: (row) => String(row.championTeamName ?? teamName(teams, row.championTeamId as number | null)),
            },
            {
              key: "runner",
              label: "Finalista",
              render: (row) => String(row.runnerUpTeamName ?? teamName(teams, row.runnerUpTeamId as number | null)),
            },
            {
              key: "period",
              label: "Período",
              render: (row) =>
                `${row.startedAt ? formatDate(String(row.startedAt)) : "—"} – ${row.finishedAt ? formatDate(String(row.finishedAt)) : "—"}`,
            },
            {
              key: "created",
              label: "Registado",
              render: (row) => (row.createdAt ? formatDateTime(String(row.createdAt)) : "—"),
            },
          ]}
        />
      </>
    );
  } else if (section === "statistics" && selectedId) {
    content = (
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Melhores marcadores</CardTitle>
            <CardDescription>Golos registados no campeonato.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={scorers as unknown as Record<string, unknown>[]}
              columns={[
                {
                  key: "player",
                  label: "Jogador",
                  render: (row) => <span className="font-medium">{String(row.playerName)}</span>,
                },
                {
                  key: "goals",
                  label: "Golos",
                  render: (row) => <span className="tabular-nums">{String(row.goals)}</span>,
                },
              ]}
              emptyTitle="Sem marcadores"
              emptyDescription="Ainda não existem golos registados."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Melhores assistentes</CardTitle>
            <CardDescription>Assistências registadas no campeonato.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={assists as unknown as Record<string, unknown>[]}
              columns={[
                {
                  key: "player",
                  label: "Jogador",
                  render: (row) => <span className="font-medium">{String(row.playerName)}</span>,
                },
                {
                  key: "assists",
                  label: "Assistências",
                  render: (row) => <span className="tabular-nums">{String(row.assists)}</span>,
                },
              ]}
              emptyTitle="Sem assistências"
              emptyDescription="Ainda não existem assistências registadas."
            />
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Desempenho individual</CardTitle>
            <CardDescription>Consulte os números de uma equipa ou jogador neste campeonato.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="team-statistics-select">Equipa</Label>
                <Select onValueChange={handleTeamStatsChange} value={statsTeamId}>
                  <SelectTrigger className="w-full" id="team-statistics-select">
                    <SelectValue placeholder="Selecione uma equipa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {teamStats && (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Jogos", teamStats.matchesPlayed],
                    ["Vitórias", teamStats.wins],
                    ["Empates", teamStats.draws],
                    ["Derrotas", teamStats.losses],
                    ["Golos marcados", teamStats.goalsFor],
                    ["Golos sofridos", teamStats.goalsAgainst],
                  ].map(([label, value]) => (
                    <div className="border-b pb-2" key={String(label)}>
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="font-medium tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {!teamStats && statsTeamId ? (
                <p className="text-muted-foreground text-sm">Sem estatísticas para esta equipa.</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="player-statistics-select">Jogador</Label>
                <Select onValueChange={handlePlayerStatsChange} value={statsPlayerId}>
                  <SelectTrigger className="w-full" id="player-statistics-select">
                    <SelectValue placeholder="Selecione um jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.fullName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {playerStats && (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Jogos", playerStats.matchesPlayed],
                    ["Golos", playerStats.goals],
                    ["Assistências", playerStats.assists],
                    ["Cartões amarelos", playerStats.yellowCards],
                    ["Cartões vermelhos", playerStats.redCards],
                    ["Minutos", playerStats.minutesPlayed],
                  ].map(([label, value]) => (
                    <div className="border-b pb-2" key={String(label)}>
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="font-medium tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {!playerStats && statsPlayerId ? (
                <p className="text-muted-foreground text-sm">Sem estatísticas para este jogador.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    content = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
              <Icon className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl leading-none">{meta.title}</CardTitle>
              <CardDescription>{meta.description}</CardDescription>
            </div>
          </div>
          <CardAction>{refreshButton}</CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <TournamentSelector
            allowAll={section === "histories"}
            loading={loadingRefs}
            onChange={(value) => {
              setSelectedId(value);
              setStatsTeamId("");
              setStatsPlayerId("");
              setTeamStats(null);
              setPlayerStats(null);
            }}
            tournaments={tournaments}
            value={selectedId}
          />
          {activeTournament ? (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Estado</p>
              <Badge variant="outline">{activeTournament.status}</Badge>
            </div>
          ) : null}
          {activeTournament ? (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Período</p>
              <p className="text-sm">
                {formatDate(activeTournament.period.startDate)} – {formatDate(activeTournament.period.endDate)}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">{content}</CardContent>
      </Card>
    </div>
  );
}
