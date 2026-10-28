"use client";

import * as React from "react";

import { AlertCircle, CircleHelp, Plus, RefreshCw, ShieldAlert } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  SupportCase,
  SupportCaseAssignee,
  SupportCaseInput,
  SupportCasePriority,
  SupportCaseStatus,
  SupportCaseTargetType,
  SupportCaseType,
  SupportCaseUpdate,
} from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import {
  createSupportCaseAction,
  getSupportCaseAction,
  listSupportCaseAssigneesAction,
  listSupportCasesAction,
  respondToSupportCaseAction,
  updateSupportCaseAction,
} from "@/server/actions/support-cases";

const typeLabels: Record<SupportCaseType, string> = {
  SUPPORT: "Pedido de suporte",
  REPORT: "Denúncia",
  DISPUTE: "Disputa",
  OPERATIONAL_INCIDENT: "Incidente operacional",
};

const statusLabels: Record<SupportCaseStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em análise",
  WAITING: "A aguardar",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
};

const priorityLabels: Record<SupportCasePriority, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const targetLabels: Partial<Record<SupportCaseTargetType, string>> = {
  USER: "Utilizador",
  TEAM: "Equipa",
  FIELD: "Campo",
  CONTENT: "Conteúdo",
  MATCH: "Jogo",
  BOOKING: "Reserva",
  PAYMENT: "Pagamento",
  TOURNAMENT: "Torneio",
};

const targetOptions: Record<SupportCaseType, SupportCaseTargetType[]> = {
  SUPPORT: [],
  REPORT: ["USER", "TEAM", "FIELD", "CONTENT"],
  DISPUTE: ["MATCH", "BOOKING", "PAYMENT", "TOURNAMENT"],
  OPERATIONAL_INCIDENT: [],
};

const statusOptions: SupportCaseStatus[] = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"];
const priorityOptions: SupportCasePriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

function readableDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : formatDateTime(value);
}

function activityLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATED: "Caso criado",
    RESPONDED: "Resposta",
    STATUS_CHANGED: "Estado alterado",
    PRIORITY_CHANGED: "Prioridade alterada",
    ASSIGNED: "Responsável alterado",
    CLASSIFICATION_CHANGED: "Classificação alterada",
    DUE_DATE_CHANGED: "Prazo alterado",
    RESOLVED: "Caso resolvido",
    CLOSED: "Caso encerrado",
  };
  return labels[action] ?? action;
}

function statusVariant(status: SupportCaseStatus): "default" | "outline" | "secondary" | "destructive" {
  if (status === "RESOLVED" || status === "CLOSED") return "default";
  if (status === "IN_PROGRESS") return "secondary";
  return "outline";
}

function priorityVariant(priority: SupportCasePriority): "default" | "outline" | "secondary" | "destructive" {
  if (priority === "URGENT") return "destructive";
  if (priority === "HIGH") return "secondary";
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

function EmptyState({ history }: { history: boolean }) {
  return (
    <Empty className="min-h-56 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">{history ? <ShieldAlert /> : <CircleHelp />}</EmptyMedia>
        <EmptyTitle>{history ? "Sem casos resolvidos" : "Sem casos para mostrar"}</EmptyTitle>
        <EmptyDescription>
          {history
            ? "As decisões, responsáveis, prazos e intervenções ficarão disponíveis aqui após a resolução dos casos."
            : "Crie um caso ou atualize os filtros para consultar pedidos e ocorrências."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function ActivityHistory({ supportCase, assignees }: { supportCase: SupportCase; assignees: SupportCaseAssignee[] }) {
  const activities = supportCase.activities ?? [];
  const names = new Map(assignees.map((assignee) => [assignee.id, assignee.name]));
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-sm">Histórico de intervenções</h3>
      {activities.length ? (
        <ol className="flex flex-col gap-3">
          {activities.map((activity) => (
            <li className="rounded-lg border p-3" key={activity.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-sm">{activityLabel(activity.action)}</p>
                <span className="text-muted-foreground text-xs">{readableDate(activity.createdAt)}</span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                Responsável: {activity.actorName ?? names.get(activity.actorUserId) ?? `#${activity.actorUserId}`}
              </p>
              {activity.message && <p className="mt-2 whitespace-pre-wrap text-sm">{activity.message}</p>}
              {activity.field && (
                <p className="mt-2 text-muted-foreground text-xs">
                  {activity.field}: {activity.previousValue ?? "—"} → {activity.newValue ?? "—"}
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground text-sm">Ainda não existem intervenções registadas.</p>
      )}
    </div>
  );
}

export function SupportCasesAdmin({
  type,
  history = false,
  title,
  description,
}: {
  type?: SupportCaseType;
  history?: boolean;
  title: string;
  description: string;
}) {
  const [cases, setCases] = React.useState<SupportCase[]>([]);
  const [assignees, setAssignees] = React.useState<SupportCaseAssignee[]>([]);
  const [assigneeError, setAssigneeError] = React.useState<string | null>(null);
  const [selectedCase, setSelectedCase] = React.useState<SupportCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newSubject, setNewSubject] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newPriority, setNewPriority] = React.useState<SupportCasePriority>("NORMAL");
  const [newClassification, setNewClassification] = React.useState("");
  const [newTargetType, setNewTargetType] = React.useState<SupportCaseTargetType | "">("");
  const [newTargetId, setNewTargetId] = React.useState("");
  const [newEvidenceUrl, setNewEvidenceUrl] = React.useState("");
  const [newDueDate, setNewDueDate] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SupportCaseStatus | "ALL">("ALL");
  const [reply, setReply] = React.useState("");
  const [nextStatus, setNextStatus] = React.useState<SupportCaseStatus>("OPEN");
  const [nextPriority, setNextPriority] = React.useState<SupportCasePriority>("NORMAL");
  const [assignedUserId, setAssignedUserId] = React.useState("");
  const [classification, setClassification] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [resolutionNote, setResolutionNote] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    listSupportCaseAssigneesAction().then((result) => {
      if (cancelled) return;
      if (result.ok) setAssignees(result.data);
      else setAssigneeError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally reloads after mutations.
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSupportCasesAction({
      ...(type ? { type } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(history ? { history: true } : {}),
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) setCases(result.data);
      else setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [type, statusFilter, history, refreshKey]);

  function resetCreateForm() {
    setNewSubject("");
    setNewDescription("");
    setNewPriority("NORMAL");
    setNewClassification("");
    setNewTargetType("");
    setNewTargetId("");
    setNewEvidenceUrl("");
    setNewDueDate("");
  }

  async function createCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type) return;
    if (Boolean(newTargetType) !== Boolean(newTargetId.trim())) {
      toast.error("Selecione uma entidade e indique o respetivo ID.");
      return;
    }
    setSaving(true);
    const input: SupportCaseInput = {
      type,
      priority: newPriority,
      subject: newSubject,
      description: newDescription,
      ...(newClassification ? { classification: newClassification } : {}),
      ...(newTargetType ? { targetType: newTargetType } : {}),
      ...(newTargetId ? { targetId: newTargetId } : {}),
      ...(newEvidenceUrl ? { evidenceUrl: newEvidenceUrl } : {}),
      ...(newDueDate ? { dueAt: new Date(`${newDueDate}T23:59:59`).toISOString() } : {}),
    };
    const result = await createSupportCaseAction(input);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Caso criado.");
    setCreateOpen(false);
    resetCreateForm();
    setRefreshKey((key) => key + 1);
  }

  async function openCase(caseId: number) {
    const result = await getSupportCaseAction(caseId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSelectedCase(result.data);
    setNextStatus(result.data.status);
    setNextPriority(result.data.priority);
    setAssignedUserId(result.data.assignedUserId ? String(result.data.assignedUserId) : "");
    setClassification(result.data.classification ?? "");
    setDueDate(result.data.dueAt ? new Date(result.data.dueAt).toISOString().slice(0, 10) : "");
    setResolutionNote(result.data.resolutionNote ?? "");
    setReply("");
  }

  async function updateCase(input: SupportCaseUpdate) {
    if (!selectedCase) return;
    setSaving(true);
    const result = await updateSupportCaseAction(selectedCase.id, input);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Caso atualizado.");
    await openCase(selectedCase.id);
    setRefreshKey((key) => key + 1);
  }

  async function saveDetails() {
    if (!selectedCase) return;
    const id = assignedUserId.trim() ? Number(assignedUserId) : null;
    if (id !== null && (!Number.isInteger(id) || id < 1)) {
      toast.error("Indique um ID de responsável válido.");
      return;
    }
    if ((nextStatus === "RESOLVED" || nextStatus === "CLOSED") && !resolutionNote.trim()) {
      toast.error("Registe uma decisão antes de resolver ou encerrar o caso.");
      return;
    }
    await updateCase({
      status: nextStatus,
      priority: nextPriority,
      assignedUserId: id,
      classification: classification.trim() || null,
      dueAt: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
      ...(nextStatus === "RESOLVED" || nextStatus === "CLOSED" ? { resolutionNote } : {}),
    });
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCase || !reply.trim()) return;
    setSaving(true);
    const result = await respondToSupportCaseAction(selectedCase.id, reply);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Resposta registada.");
    setReply("");
    await openCase(selectedCase.id);
  }

  const canCreate = Boolean(type && !history);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {!history && (
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as SupportCaseStatus | "ALL")}
              >
                <SelectTrigger aria-label="Filtrar por estado">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todos os estados</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              aria-label="Atualizar lista"
            >
              <RefreshCw data-icon="inline-start" />
              Atualizar
            </Button>
            {canCreate && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus data-icon="inline-start" />
                Criar caso
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Não foi possível carregar os casos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <LoadingState />
          ) : cases.length === 0 ? (
            <EmptyState history={history} />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caso</TableHead>
                    {!type && <TableHead>Tipo</TableHead>}
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((supportCase) => (
                    <TableRow key={supportCase.id}>
                      <TableCell>
                        <div className="flex min-w-44 flex-col gap-1">
                          <span className="font-medium">{supportCase.subject}</span>
                          <span className="text-muted-foreground text-xs">
                            #{supportCase.id}
                            {supportCase.targetType
                              ? ` · ${targetLabels[supportCase.targetType] ?? supportCase.targetType} ${supportCase.targetId ?? ""}`
                              : ""}
                          </span>
                        </div>
                      </TableCell>
                      {!type && <TableCell>{typeLabels[supportCase.type]}</TableCell>}
                      <TableCell>
                        <Badge variant={statusVariant(supportCase.status)}>{statusLabels[supportCase.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant(supportCase.priority)}>
                          {priorityLabels[supportCase.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supportCase.assignedUserId
                          ? (assignees.find((assignee) => assignee.id === supportCase.assignedUserId)?.name ??
                            `#${supportCase.assignedUserId}`)
                          : "Por atribuir"}
                      </TableCell>
                      <TableCell>{readableDate(supportCase.dueAt)}</TableCell>
                      <TableCell>{readableDate(supportCase.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => void openCase(supportCase.id)}>
                          Consultar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Criar {type ? typeLabels[type].toLowerCase() : "caso"}</DialogTitle>
            <DialogDescription>Registe o caso para acompanhamento pela equipa de suporte.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={createCase}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="support-case-subject">Assunto</FieldLabel>
                <Input
                  id="support-case-subject"
                  value={newSubject}
                  onChange={(event) => setNewSubject(event.target.value)}
                  minLength={3}
                  maxLength={180}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="support-case-description">Descrição</FieldLabel>
                <Textarea
                  id="support-case-description"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  minLength={10}
                  maxLength={10000}
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="support-case-new-priority">Prioridade</FieldLabel>
                  <Select value={newPriority} onValueChange={(value) => setNewPriority(value as SupportCasePriority)}>
                    <SelectTrigger id="support-case-new-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {priorityOptions.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priorityLabels[priority]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="support-case-classification">Classificação</FieldLabel>
                  <Input
                    id="support-case-classification"
                    value={newClassification}
                    onChange={(event) => setNewClassification(event.target.value)}
                    maxLength={120}
                  />
                </Field>
              </div>
              {type && targetOptions[type].length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="support-case-target-type">Entidade associada</FieldLabel>
                    <Select
                      value={newTargetType || "NONE"}
                      onValueChange={(value) =>
                        setNewTargetType(value === "NONE" ? "" : (value as SupportCaseTargetType))
                      }
                    >
                      <SelectTrigger id="support-case-target-type">
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="NONE">Sem entidade</SelectItem>
                          {targetOptions[type].map((target) => (
                            <SelectItem key={target} value={target}>
                              {targetLabels[target]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-case-target-id">ID da entidade</FieldLabel>
                    <Input
                      id="support-case-target-id"
                      value={newTargetId}
                      onChange={(event) => setNewTargetId(event.target.value)}
                      maxLength={100}
                    />
                  </Field>
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="support-case-due-date">Prazo</FieldLabel>
                <Input
                  id="support-case-due-date"
                  type="date"
                  value={newDueDate}
                  onChange={(event) => setNewDueDate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="support-case-evidence">Ligação de evidência</FieldLabel>
                <Input
                  id="support-case-evidence"
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(event) => setNewEvidenceUrl(event.target.value)}
                  maxLength={2048}
                  placeholder="https://"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "A criar..." : "Criar caso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedCase)}
        onOpenChange={(open) => {
          if (!open) setSelectedCase(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedCase && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCase.subject}</DialogTitle>
                <DialogDescription>
                  Caso #{selectedCase.id} · {typeLabels[selectedCase.type]} · Criado em{" "}
                  {readableDate(selectedCase.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <p className="whitespace-pre-wrap text-sm">{selectedCase.description}</p>
                {selectedCase.evidenceUrl && (
                  <p className="text-sm">
                    Evidência:{" "}
                    <a
                      className="text-primary underline underline-offset-4"
                      href={selectedCase.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir ligação
                    </a>
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="support-case-status">Estado</FieldLabel>
                    <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as SupportCaseStatus)}>
                      <SelectTrigger id="support-case-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {statusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-case-priority">Prioridade</FieldLabel>
                    <Select
                      value={nextPriority}
                      onValueChange={(value) => setNextPriority(value as SupportCasePriority)}
                    >
                      <SelectTrigger id="support-case-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priorityLabels[priority]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-case-assignee">Responsável</FieldLabel>
                    <Select
                      value={assignedUserId || "NONE"}
                      onValueChange={(value) => setAssignedUserId(value === "NONE" ? "" : value)}
                    >
                      <SelectTrigger id="support-case-assignee">
                        <SelectValue placeholder="Por atribuir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="NONE">Por atribuir</SelectItem>
                          {assignees.map((assignee) => (
                            <SelectItem key={assignee.id} value={String(assignee.id)}>
                              {assignee.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-case-detail-classification">Classificação</FieldLabel>
                    <Input
                      id="support-case-detail-classification"
                      value={classification}
                      onChange={(event) => setClassification(event.target.value)}
                      maxLength={120}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-case-update-due-date">Prazo</FieldLabel>
                    <Input
                      id="support-case-update-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </Field>
                </div>
                {assigneeError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Não foi possível carregar os responsáveis</AlertTitle>
                    <AlertDescription>{assigneeError}</AlertDescription>
                  </Alert>
                )}
                {!assigneeError && assignees.length === 0 && (
                  <Alert>
                    <AlertCircle />
                    <AlertTitle>Sem responsáveis disponíveis</AlertTitle>
                    <AlertDescription>
                      Adicione uma conta ativa com perfil de moderador ou administrador para atribuir este caso.
                    </AlertDescription>
                  </Alert>
                )}
                {(nextStatus === "RESOLVED" || nextStatus === "CLOSED") && (
                  <Field>
                    <FieldLabel htmlFor="support-case-resolution">Decisão / resolução</FieldLabel>
                    <Textarea
                      id="support-case-resolution"
                      value={resolutionNote}
                      onChange={(event) => setResolutionNote(event.target.value)}
                      required
                    />
                  </Field>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => void saveDetails()} disabled={saving}>
                    {saving ? "A guardar..." : "Guardar alterações"}
                  </Button>
                </div>
                <form className="flex flex-col gap-3 border-t pt-4" onSubmit={sendReply}>
                  <Field>
                    <FieldLabel htmlFor="support-case-reply">Responder</FieldLabel>
                    <Textarea
                      id="support-case-reply"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      maxLength={10000}
                      required
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" variant="outline" disabled={saving || !reply.trim()}>
                      {saving ? "A enviar..." : "Registar resposta"}
                    </Button>
                  </div>
                </form>
                <ActivityHistory supportCase={selectedCase} assignees={assignees} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
