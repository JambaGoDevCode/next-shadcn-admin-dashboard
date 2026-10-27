"use client";

import * as React from "react";

import Link from "next/link";

import { AlertTriangle, Check, CircleHelp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { MatchDisputeDecision, MatchmakingQueueJobStatus, MatchResultValidationStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import {
  getMatchmakingOperationsAction,
  listChallengesAction,
  listMatchDisputesAction,
  listResultsAction,
  type MatchmakingOperationsView,
  type NamedMatch,
  type NamedMatchDispute,
  type NamedQueueJob,
  type NamedSearchAttempt,
  resolveMatchDisputeAction,
  validateMatchResultAction,
} from "@/server/actions/games-operations";

export type GamesOperationsView = "challenges" | "matchmaking" | "results" | "disputes";

const copy: Record<GamesOperationsView, { title: string; description: string }> = {
  challenges: {
    title: "Desafios",
    description: "Acompanhe os convites de jogo entre equipas e o estado de resposta de cada lado.",
  },
  matchmaking: {
    title: "Procura de adversários",
    description: "Monitorize pesquisas, tentativas sem correspondência, falhas e convites pendentes.",
  },
  results: {
    title: "Resultados",
    description: "Consulte jogos terminados e valide os resultados submetidos pelas equipas.",
  },
  disputes: {
    title: "Disputas e denúncias",
    description: "Analise contestações de resultados e denúncias associadas a jogos.",
  },
};

function readableDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : formatDateTime(value);
}

function validationLabel(status?: MatchResultValidationStatus): string {
  if (status === "VALIDATED") return "Validado";
  if (status === "DISPUTED") return "Contestado";
  if (status === "PENDING") return "Pendente";
  return "Indisponível";
}

function validationVariant(status?: MatchResultValidationStatus): "default" | "outline" | "secondary" | "destructive" {
  if (status === "VALIDATED") return "default";
  if (status === "DISPUTED") return "destructive";
  if (status === "PENDING") return "secondary";
  return "outline";
}

function attemptLabel(status: NamedSearchAttempt["status"]): string {
  if (status === "MATCHED") return "Com correspondência";
  if (status === "NO_MATCH") return "Sem correspondência";
  if (status === "FAILED") return "Falhou";
  return "A processar";
}

function attemptVariant(status: NamedSearchAttempt["status"]): "default" | "outline" | "secondary" | "destructive" {
  if (status === "MATCHED") return "default";
  if (status === "FAILED") return "destructive";
  if (status === "NO_MATCH") return "secondary";
  return "outline";
}

function queueJobLabel(status: MatchmakingQueueJobStatus): string {
  if (status === "waiting") return "Na fila";
  if (status === "active") return "Em execução";
  if (status === "delayed") return "Atrasado";
  if (status === "failed") return "Falhou";
  if (status === "completed") return "Concluído";
  return "Pausado";
}

function queueJobVariant(status: MatchmakingQueueJobStatus): "default" | "outline" | "secondary" | "destructive" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "waiting" || status === "delayed") return "secondary";
  return "outline";
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="min-h-56 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleHelp />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function GamesOperations({ view }: { view: GamesOperationsView }) {
  const [challenges, setChallenges] = React.useState<NamedMatch[]>([]);
  const [results, setResults] = React.useState<NamedMatch[]>([]);
  const [matchmaking, setMatchmaking] = React.useState<MatchmakingOperationsView | null>(null);
  const [disputes, setDisputes] = React.useState<NamedMatchDispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [selectedDispute, setSelectedDispute] = React.useState<NamedMatchDispute | null>(null);
  const [decision, setDecision] = React.useState<MatchDisputeDecision | null>(null);
  const [resolutionNote, setResolutionNote] = React.useState("");
  const [homeScore, setHomeScore] = React.useState("");
  const [awayScore, setAwayScore] = React.useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally retriggers loading after mutations.
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        if (view === "challenges") {
          const result = await listChallengesAction();
          if (cancelled) return;
          if (result.ok) setChallenges(result.data);
          else setError(result.error);
        } else if (view === "matchmaking") {
          const result = await getMatchmakingOperationsAction();
          if (cancelled) return;
          if (result.ok) setMatchmaking(result.data);
          else setError(result.error);
        } else if (view === "results") {
          const result = await listResultsAction();
          if (cancelled) return;
          if (result.ok) setResults(result.data);
          else setError(result.error);
        } else {
          const result = await listMatchDisputesAction();
          if (cancelled) return;
          if (result.ok) setDisputes(result.data);
          else setError(result.error);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar esta área.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [view, refreshKey]);

  async function validateResult(matchId: number) {
    setSaving(true);
    const result = await validateMatchResultAction(matchId);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Resultado validado.");
    setRefreshKey((value) => value + 1);
  }

  function openResolution(dispute: NamedMatchDispute, nextDecision: MatchDisputeDecision) {
    setSelectedDispute(dispute);
    setDecision(nextDecision);
    setResolutionNote("");
    setHomeScore(String(dispute.originalHomeScore));
    setAwayScore(String(dispute.originalAwayScore));
  }

  async function submitResolution(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDispute || !decision) return;
    if (resolutionNote.trim().length < 10) {
      toast.error("A justificação deve ter pelo menos 10 caracteres.");
      return;
    }

    let input: Parameters<typeof resolveMatchDisputeAction>[1];
    if (decision === "CORRECT") {
      const parsedHomeScore = Number(homeScore);
      const parsedAwayScore = Number(awayScore);
      if (
        !Number.isInteger(parsedHomeScore) ||
        parsedHomeScore < 0 ||
        !Number.isInteger(parsedAwayScore) ||
        parsedAwayScore < 0
      ) {
        toast.error("Indique um resultado válido para as duas equipas.");
        return;
      }
      input = {
        decision,
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
        resolutionNote: resolutionNote.trim(),
      };
    } else if (decision === "MAINTAIN" || decision === "UPHOLD" || decision === "DISMISS") {
      input = { decision, resolutionNote: resolutionNote.trim() };
    } else {
      toast.error("Decisão inválida para esta disputa.");
      return;
    }

    setSaving(true);
    const result = await resolveMatchDisputeAction(selectedDispute.id, input);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Disputa resolvida e decisão registada.");
    setSelectedDispute(null);
    setDecision(null);
    setRefreshKey((value) => value + 1);
  }

  const page = copy[view];
  let content: React.ReactNode = null;

  if (loading) {
    content = <LoadingState />;
  } else if (!error) {
    switch (view) {
      case "challenges":
        content = <ChallengesTable matches={challenges} />;
        break;
      case "matchmaking":
        content = matchmaking ? (
          <MatchmakingPanel operations={matchmaking} />
        ) : (
          <EmptyState title="Sem dados" description="A API não devolveu dados de matchmaking." />
        );
        break;
      case "results":
        content = <ResultsTable matches={results} onValidate={validateResult} saving={saving} />;
        break;
      case "disputes":
        content = <DisputesTable disputes={disputes} onResolve={openResolution} />;
        break;
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-semibold text-2xl tracking-tight">{page.title}</h1>
          <p className="text-muted-foreground text-sm">{page.description}</p>
        </div>
        <Button onClick={() => setRefreshKey((value) => value + 1)} variant="outline">
          <RefreshCw data-icon="inline-start" />
          Atualizar
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar os dados</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {content}

      <Dialog
        onOpenChange={(open) => {
          if (!open && !saving) {
            setSelectedDispute(null);
            setDecision(null);
          }
        }}
        open={selectedDispute !== null}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDispute?.category === "RESULT" ? "Decidir contestação de resultado" : "Decidir denúncia do jogo"}
            </DialogTitle>
            <DialogDescription>
              Jogo #{selectedDispute?.matchId} · {selectedDispute?.homeTeamName} vs. {selectedDispute?.awayTeamName}
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && decision ? (
            <form className="flex flex-col gap-4" onSubmit={submitResolution}>
              {decision === "CORRECT" ? (
                <FieldSet>
                  <FieldLegend>Resultado decidido</FieldLegend>
                  <FieldGroup className="grid grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="dispute-home-score">{selectedDispute.homeTeamName}</FieldLabel>
                      <Input
                        id="dispute-home-score"
                        min="0"
                        onChange={(event) => setHomeScore(event.target.value)}
                        required
                        type="number"
                        value={homeScore}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="dispute-away-score">{selectedDispute.awayTeamName}</FieldLabel>
                      <Input
                        id="dispute-away-score"
                        min="0"
                        onChange={(event) => setAwayScore(event.target.value)}
                        required
                        type="number"
                        value={awayScore}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              ) : null}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="dispute-resolution-note">Justificação da decisão</FieldLabel>
                  <Textarea
                    id="dispute-resolution-note"
                    maxLength={2000}
                    minLength={10}
                    onChange={(event) => setResolutionNote(event.target.value)}
                    required
                    value={resolutionNote}
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button disabled={saving} type="submit">
                  {saving ? "A guardar…" : "Confirmar decisão"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChallengesTable({ matches }: { matches: NamedMatch[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Convites entre equipas</CardTitle>
        <CardDescription>Respostas registadas pelos responsáveis de cada equipa.</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <EmptyState
            title="Sem desafios por acompanhar"
            description="Não existem jogos agendados ou adiados à espera de resposta."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jogo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Equipa da casa</TableHead>
                <TableHead>Equipa visitante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">
                    {match.homeTeamName} <span className="text-muted-foreground">vs.</span> {match.awayTeamName}
                  </TableCell>
                  <TableCell>{readableDate(match.matchDate)}</TableCell>
                  <TableCell>
                    <Badge variant={match.status === "POSTPONED" ? "secondary" : "outline"}>
                      {match.status === "POSTPONED" ? "Adiado" : "Agendado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{match.homeAcceptedAt ? "Aceite" : "A aguardar"}</TableCell>
                  <TableCell>{match.awayAcceptedAt ? "Aceite" : "A aguardar"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MatchmakingPanel({ operations }: { operations: MatchmakingOperationsView }) {
  const metrics = [
    { label: "Pesquisas em processamento", value: operations.counts.processing },
    { label: "Com adversário", value: operations.counts.matched },
    { label: "Sem correspondência", value: operations.counts.unmatched },
    { label: "Falhadas", value: operations.counts.failed },
    { label: "Convites pendentes", value: operations.counts.pendingInvitations },
  ];
  const queueMetrics = [
    { label: "Na fila", value: operations.queue.counts.waiting },
    { label: "Em execução", value: operations.queue.counts.active },
    { label: "Atrasados", value: operations.queue.counts.delayed },
    { label: "Falhados", value: operations.queue.counts.failed },
    { label: "Concluídos", value: operations.queue.counts.completed },
    { label: "Pausados", value: operations.queue.counts.paused },
  ];
  const queueMetricsGrid = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {queueMetrics.map((metric) => (
        <Card key={metric.label} size="sm">
          <CardHeader>
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{metric.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
  let queueContent: React.ReactNode;

  if (!operations.queue.available) {
    queueContent = (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Fila indisponível</AlertTitle>
        <AlertDescription>{operations.queue.error ?? "Não foi possível consultar a fila BullMQ."}</AlertDescription>
      </Alert>
    );
  } else {
    queueContent = (
      <>
        {queueMetricsGrid}
        {operations.queue.jobs.length === 0 ? (
          <EmptyState
            title="Sem jobs na fila"
            description="As tarefas recentes de matchmaking serão apresentadas aqui."
          />
        ) : (
          <MatchmakingQueueTable jobs={operations.queue.jobs} />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fila BullMQ</CardTitle>
          <CardDescription>
            Estado dos jobs recentes retidos no BullMQ; o histórico completo permanece nas pesquisas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{queueContent}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de pesquisas</CardTitle>
          <CardDescription>As últimas 100 tentativas; os totais acima abrangem todo o histórico.</CardDescription>
        </CardHeader>
        <CardContent>
          {operations.attempts.length === 0 ? (
            <EmptyState
              title="Ainda sem pesquisas"
              description="As pesquisas efetuadas aparecerão aqui, incluindo as que não encontraram adversário."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Candidatos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Detalhe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.teamName}</TableCell>
                    <TableCell>
                      <Badge variant={attemptVariant(attempt.status)}>{attemptLabel(attempt.status)}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{attempt.candidateCount}</TableCell>
                    <TableCell>{readableDate(attempt.createdAt)}</TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground">
                      {attempt.errorMessage ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Convites em espera</CardTitle>
          <CardDescription>Propostas ainda sem resposta, organizadas pela data de criação.</CardDescription>
        </CardHeader>
        <CardContent>
          {operations.invitations.filter((invitation) => invitation.status === "PENDING").length === 0 ? (
            <EmptyState
              title="Sem convites pendentes"
              description="Não há convites de matchmaking a aguardar resposta."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {operations.invitations
                .filter((invitation) => invitation.status === "PENDING")
                .map((invitation) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                    key={invitation.id}
                  >
                    <div className="font-medium text-sm">
                      {invitation.requesterTeamName} <span className="text-muted-foreground">→</span>{" "}
                      {invitation.candidateTeamName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pendente</Badge>
                      <span className="text-muted-foreground text-xs">{readableDate(invitation.createdAt)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchmakingQueueTable({ jobs }: { jobs: NamedQueueJob[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job</TableHead>
          <TableHead>Equipa</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Adicionado</TableHead>
          <TableHead>Detalhe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-mono text-xs">{job.id}</TableCell>
            <TableCell className="font-medium">{job.teamName}</TableCell>
            <TableCell>
              <Badge variant={queueJobVariant(job.status)}>{queueJobLabel(job.status)}</Badge>
            </TableCell>
            <TableCell>{readableDate(job.enqueuedAt)}</TableCell>
            <TableCell className="max-w-64 truncate text-muted-foreground">{job.failureReason ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ResultsTable({
  matches,
  onValidate,
  saving,
}: {
  matches: NamedMatch[];
  onValidate: (matchId: number) => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados submetidos</CardTitle>
        <CardDescription>Confirme o resultado final ou encaminhe os jogos contestados para análise.</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <EmptyState title="Sem resultados" description="Ainda não existem jogos finalizados para validação." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jogo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Validação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => {
                let action: React.ReactNode;
                if (match.resultValidationStatus === "PENDING") {
                  action = (
                    <Button disabled={saving} onClick={() => onValidate(match.id)} size="sm">
                      <Check data-icon="inline-start" />
                      Validar
                    </Button>
                  );
                } else if (match.resultValidationStatus === "DISPUTED") {
                  action = (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/jogos-e-desafios/disputas">Analisar disputa</Link>
                    </Button>
                  );
                } else {
                  action = <span className="text-muted-foreground text-xs">Sem ação pendente</span>;
                }

                return (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      {match.homeTeamName} <span className="text-muted-foreground">vs.</span> {match.awayTeamName}
                    </TableCell>
                    <TableCell>{readableDate(match.matchDate)}</TableCell>
                    <TableCell className="tabular-nums">
                      {match.homeScore ?? "—"} : {match.awayScore ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={validationVariant(match.resultValidationStatus)}>
                        {validationLabel(match.resultValidationStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{action}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DisputesTable({
  disputes,
  onResolve,
}: {
  disputes: NamedMatchDispute[];
  onResolve: (dispute: NamedMatchDispute, decision: MatchDisputeDecision) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Casos de jogos</CardTitle>
        <CardDescription>
          As decisões são registadas com uma justificação e ficam associadas ao histórico do caso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {disputes.length === 0 ? (
          <EmptyState
            title="Sem disputas ou denúncias"
            description="Os casos apresentados pelos responsáveis das equipas serão listados aqui."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {disputes.map((dispute) => (
              <article className="rounded-lg border p-4" key={dispute.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">
                      {dispute.homeTeamName} <span className="text-muted-foreground">vs.</span> {dispute.awayTeamName}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {dispute.category === "RESULT" ? "Contestação do resultado" : "Denúncia de conduta"} · submetida
                      por {dispute.reportingTeamName}
                    </div>
                  </div>
                  <Badge variant={dispute.status === "OPEN" ? "secondary" : "outline"}>
                    {dispute.status === "OPEN" ? "Em análise" : "Resolvida"}
                  </Badge>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{dispute.reason}</p>
                {dispute.evidenceUrl ? (
                  <a
                    className="mt-2 inline-block text-primary text-sm underline underline-offset-4"
                    href={dispute.evidenceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Consultar prova apresentada
                  </a>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <div className="text-muted-foreground text-xs">
                    Resultado original: {dispute.originalHomeScore} : {dispute.originalAwayScore}
                    {dispute.status === "RESOLVED" && dispute.decision ? (
                      <span>
                        {" "}
                        · decisão: {dispute.decision} · {dispute.resolutionNote}
                      </span>
                    ) : null}
                  </div>
                  {dispute.status === "OPEN" ? (
                    <div className="flex flex-wrap gap-2">
                      {dispute.category === "RESULT" ? (
                        <>
                          <Button onClick={() => onResolve(dispute, "MAINTAIN")} size="sm" variant="outline">
                            Manter resultado
                          </Button>
                          <Button onClick={() => onResolve(dispute, "CORRECT")} size="sm">
                            Corrigir resultado
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => onResolve(dispute, "UPHOLD")} size="sm">
                            Aceitar denúncia
                          </Button>
                          <Button onClick={() => onResolve(dispute, "DISMISS")} size="sm" variant="outline">
                            Arquivar denúncia
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
