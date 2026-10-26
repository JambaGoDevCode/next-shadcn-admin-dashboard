"use client";

import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EngagementStates, OperationState } from "@/lib/api/types";
import { bookingStatusLabel, matchmakingStatusLabel, matchStatusLabel } from "@/lib/format";

import { HBarChart } from "./hbar-chart";

interface EngagementStatesCardProps {
  data: EngagementStates | null;
  failed: boolean;
}

function toChartData(states: OperationState[], labelOf: (status: string) => string) {
  return states.map((state) => ({
    label: labelOf(state.status),
    value: state.count,
    display: `${state.count}`,
  }));
}

const TABS = [
  { value: "bookings", label: "Reservas" },
  { value: "matches", label: "Partidas" },
  { value: "matchmaking", label: "Matchmaking" },
] as const;

/** Distribuição de reservas, partidas e pedidos de matchmaking por estado. */
export function EngagementStatesCard({ data, failed }: EngagementStatesCardProps) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Estados das operações</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">Como as operações estão a terminar no período.</CardDescription>

      <CardContent className="px-0">
        {failed && !data ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar os estados.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : (
          <Tabs defaultValue="bookings" className="flex flex-col gap-3">
            <TabsList className="w-full justify-start border-b px-2.5" variant="line">
              {TABS.map((tab) => (
                <TabsTrigger className="flex-none font-normal" key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="bookings" className="px-0">
              <HBarChart
                data={toChartData(data?.bookings ?? [], bookingStatusLabel)}
                emptyText="Sem reservas no período."
              />
            </TabsContent>

            <TabsContent value="matches" className="px-0">
              <HBarChart
                data={toChartData(data?.matches ?? [], matchStatusLabel)}
                emptyText="Sem partidas no período."
              />
            </TabsContent>

            <TabsContent value="matchmaking" className="px-0">
              <HBarChart
                data={toChartData(data?.matchmaking ?? [], matchmakingStatusLabel)}
                emptyText="Sem pedidos de matchmaking no período."
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
