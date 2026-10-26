import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface OverviewStat {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  failed?: boolean;
}

export function OverviewKpis({ stats }: { readonly stats: OverviewStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-sm text-muted-foreground">{stat.label}</CardTitle>
            {stat.failed && <Badge variant="destructive">offline</Badge>}
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none tracking-tight">{stat.failed ? "—" : stat.value}</div>
            {stat.hint && !stat.failed ? <p className="text-muted-foreground mt-1 text-xs">{stat.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
