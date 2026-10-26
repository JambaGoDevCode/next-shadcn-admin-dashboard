const numberFormatter = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

const STEP_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  emptyText?: string;
  /** Nota sob o funil (ex.: utilizadores com ação). */
  note?: string;
}

/** Funil em etapas com larguras proporcionais e conversão entre passos. */
export function FunnelChart({ steps, emptyText = "Sem dados no período selecionado.", note }: FunnelChartProps) {
  const max = Math.max(...steps.map((step) => step.count), 1);

  if (steps.every((step) => step.count === 0)) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-muted-foreground text-sm">{emptyText}</p>
        {note ? <p className="text-muted-foreground/70 text-xs">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col justify-center gap-3 py-2">
      {steps.map((step, index) => {
        const previous = index > 0 ? steps[index - 1] : null;
        const conversion = previous && previous.count > 0 ? Math.round((step.count / previous.count) * 100) : null;

        return (
          <div className="space-y-1" key={step.key}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {index + 1}. {step.label}
              </span>
              <span className="font-medium text-foreground tabular-nums">{numberFormatter.format(step.count)}</span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-muted">
              <div
                className="h-full rounded-lg"
                style={{
                  width: `${Math.max(3, Math.round((step.count / max) * 100))}%`,
                  backgroundColor: STEP_COLORS[index % STEP_COLORS.length],
                  opacity: 0.8,
                }}
              />
            </div>
            {conversion !== null && index > 0 ? (
              <p className="text-muted-foreground text-xs">{conversion}% avançaram do passo anterior</p>
            ) : null}
          </div>
        );
      })}
      {note ? <p className="text-muted-foreground/70 text-xs">{note}</p> : null}
    </div>
  );
}
