import { getDepartments, getMemberCatalog, getTasks } from "@/lib/api/resources";
import type { DepartmentItem, MemberInfo, TaskItem } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { CalendarPanel } from "./_components/calendar-panel";
import { FocusCard } from "./_components/focus-card";
import { ProductivityWorkspace } from "./_components/productivity-workspace";
import { QuoteCard } from "./_components/quote-card";
import { RecentTasksCard } from "./_components/recent-tasks-card";
import { WeeklySummaryCard } from "./_components/weekly-summary-card";

export default async function Page() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let data: { departments: DepartmentItem[]; tasks: TaskItem[]; catalog: MemberInfo[] } | null = null;
  let error: string | null = null;

  try {
    const [departments, tasks, catalog] = await Promise.all([
      getDepartments(token),
      getTasks(token),
      getMemberCatalog(token),
    ]);
    data = { departments, tasks, catalog };
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Erro ao carregar os dados.";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="lg:col-span-9">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl text-foreground leading-none tracking-tight">Gestão de tarefas</h1>
            <p className="text-lg text-muted-foreground leading-none">
              Departamentos, prazos e responsáveis da equipa num só lugar.
            </p>
          </div>

          {error || !data ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-8">
              <p className="text-destructive text-sm">Não foi possível carregar as tarefas: {error}</p>
              <a className="text-primary text-sm underline underline-offset-4" href="/dashboard/productivity">
                Tentar novamente
              </a>
            </div>
          ) : (
            <>
              <ProductivityWorkspace departments={data.departments} tasks={data.tasks} catalog={data.catalog} />
              <QuoteCard />
            </>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 lg:col-span-3">
        <CalendarPanel />
        <FocusCard />
        <RecentTasksCard tasks={data?.tasks ?? []} />
        <WeeklySummaryCard tasks={data?.tasks ?? []} />
      </section>
    </div>
  );
}
