export interface HbarDatum {
  label: string;
  value: number;
  /** Texto exibido à direita (por omissão: valor formatado). */
  display?: string;
}

const numberFormatter = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

interface HBarChartProps {
  data: HbarDatum[];
  emptyText?: string;
  /** Cor de fundo das barras (token de tema). */
  color?: string;
}

/**
 * Barras horizontais leves (sem dependência de gráficos) com o mesmo
 * desenho dos gráficos de barras do template: rótulo, barra e valor.
 */
export function HBarChart({ data, emptyText = "Sem dados para exibir.", color = "var(--chart-1)" }: HBarChartProps) {
  if (data.length === 0 || data.every((datum) => datum.value === 0)) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">{emptyText}</div>;
  }

  const max = Math.max(...data.map((datum) => datum.value), 1);

  return (
    <div className="flex min-h-64 flex-col justify-center gap-3 px-4 py-4">
      {data.map((datum) => (
        <div className="flex items-center gap-3" key={datum.label}>
          <span className="w-32 shrink-0 truncate text-muted-foreground text-sm" title={datum.label}>
            {datum.label}
          </span>
          <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
            <div
              className="h-full rounded-md"
              style={{
                width: `${Math.max(3, Math.round((datum.value / max) * 100))}%`,
                backgroundColor: color,
                opacity: 0.55,
              }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-foreground text-sm tabular-nums">
            {datum.display ?? numberFormatter.format(datum.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
