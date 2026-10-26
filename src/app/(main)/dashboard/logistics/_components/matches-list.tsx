"use client";

import * as React from "react";

import { MoreHorizontal, Plus, Search, Shuffle, SlidersHorizontal, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { MatchSimple } from "@/lib/api/types";
import { listLogisticsMatchesAction } from "@/server/actions/logistics";

import { MatchCard } from "./match-card";

type MatchTab = "today" | "upcoming" | "previous" | "all";

type MatchesListProps = {
  /** Seleciona uma partida — o `cityId` alimenta a ligação em tempo real. */
  onSelectMatch: (matchId: number, cityId: number | null) => void;
  selectedMatchId: number | null;
  /** Devolve a partida preferida (do separador "Hoje" por omissão) e a sua cidade quando a lista carrega. */
  onMatchesLoaded?: (preferredMatchId: number | null, cityId: number | null) => void;
  /** Incrementar para recarregar a lista após ações CRUD ou eventos realtime. */
  refreshKey?: number;
  onCreateMatch?: () => void;
  onRandomMatches?: () => void;
  onFindOpponent?: () => void;
};

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function matchTimestamp(match: MatchSimple): number {
  const value = new Date(match.matchDate).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export function MatchesList({
  onSelectMatch,
  selectedMatchId,
  onMatchesLoaded,
  refreshKey = 0,
  onCreateMatch,
  onRandomMatches,
  onFindOpponent,
}: MatchesListProps) {
  const [matches, setMatches] = React.useState<MatchSimple[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reload, setReload] = React.useState(0);
  const [tab, setTab] = React.useState<MatchTab>("today");
  const [query, setQuery] = React.useState("");

  const onMatchesLoadedRef = React.useRef(onMatchesLoaded);
  React.useEffect(() => {
    onMatchesLoadedRef.current = onMatchesLoaded;
  });

  React.useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError(null);

      try {
        const result = await listLogisticsMatchesAction();
        if (cancelled) return;

        if (result.ok) {
          setMatches(result.data);

          // Partida preferida: primeiro jogo de hoje → próximo jogo → último jogo anterior.
          const startToday = startOfToday();
          const endOfToday = startToday + 24 * 60 * 60 * 1000;
          const sorted = [...result.data].sort((a, b) => matchTimestamp(a) - matchTimestamp(b));
          const preferred =
            sorted.find((match) => matchTimestamp(match) >= startToday && matchTimestamp(match) < endOfToday) ??
            sorted.find((match) => matchTimestamp(match) >= endOfToday) ??
            [...sorted].reverse().find((match) => matchTimestamp(match) < startToday) ??
            sorted[0] ??
            null;
          onMatchesLoadedRef.current?.(preferred?.id ?? null, preferred?.cityId ?? null);
        } else {
          setError(result.error);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar as partidas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMatches();
    return () => {
      cancelled = true;
    };
  }, [reload, refreshKey]);

  const counts = React.useMemo(() => {
    const today = startOfToday();
    const endOfToday = today + 24 * 60 * 60 * 1000;

    return {
      today: matches.filter((match) => {
        const ts = matchTimestamp(match);
        return ts >= today && ts < endOfToday;
      }).length,
      upcoming: matches.filter((match) => matchTimestamp(match) >= endOfToday).length,
      previous: matches.filter((match) => matchTimestamp(match) < today).length,
      all: matches.length,
    };
  }, [matches]);

  const visibleMatches = React.useMemo(() => {
    const today = startOfToday();
    const endOfToday = today + 24 * 60 * 60 * 1000;
    const normalizedQuery = query.trim().toLowerCase();

    return matches
      .filter((match) => {
        const ts = matchTimestamp(match);

        switch (tab) {
          case "today":
            return ts >= today && ts < endOfToday;
          case "upcoming":
            return ts >= endOfToday;
          case "previous":
            return ts < today;
          default:
            return true;
        }
      })
      .filter((match) => {
        if (!normalizedQuery) return true;
        return [match.homeTeamName, match.awayTeamName, match.fieldName, match.cityName]
          .filter(Boolean)
          .some((value) => (value ?? "").toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (tab === "previous") return matchTimestamp(b) - matchTimestamp(a);
        return matchTimestamp(a) - matchTimestamp(b);
      });
  }, [matches, tab, query]);

  return (
    <Card className="h-full rounded-none ring-0">
      <CardHeader>
        <CardTitle className="font-normal text-xl">Partidas</CardTitle>
        <CardAction className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Recarregar partidas"
            onClick={() => setReload((value) => value + 1)}
          >
            <SlidersHorizontal />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Mais ações" size="icon-sm" variant="outline">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRandomMatches}>
                <Shuffle className="size-4" />
                Gerar jogos aleatórios
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFindOpponent}>
                <Swords className="size-4" />
                Procurar adversários
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateMatch} size="sm">
            <Plus />
            Marcar jogo
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">
        <Tabs value={tab} onValueChange={(value) => setTab(value as MatchTab)}>
          <TabsList className="w-full border-b px-4" variant="line">
            <TabsTrigger className="text-xs" value="today">
              Hoje ({counts.today})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="upcoming">
              Próximos ({counts.upcoming})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="previous">
              Anteriores ({counts.previous})
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="all">
              Todos ({counts.all})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="px-4">
          <InputGroup className="h-8">
            <InputGroupInput
              className="h-8"
              aria-label="Buscar partidas"
              placeholder="Buscar partidas..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <ScrollArea className="h-0 flex-1">
          {loading ? (
            <div className="flex h-40 items-center justify-center px-4 text-sm text-muted-foreground">
              Carregando partidas...
            </div>
          ) : error ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={() => setReload((value) => value + 1)}>
                Tentar novamente
              </Button>
            </div>
          ) : visibleMatches.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-1 px-4 text-center">
              <p className="font-medium text-sm">Nenhuma partida encontrada</p>
              <p className="max-w-xs text-muted-foreground text-xs">
                {query
                  ? "Tente outro termo de busca."
                  : "As partidas aparecerão aqui quando forem agendadas."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4">
              {visibleMatches.map((match) => (
                <MatchCard
                  active={match.id === selectedMatchId}
                  key={match.id}
                  match={match}
                  onSelectMatch={(matchId) => onSelectMatch(matchId, match.cityId)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
