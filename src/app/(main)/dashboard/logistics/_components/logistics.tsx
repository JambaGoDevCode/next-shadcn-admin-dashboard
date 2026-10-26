"use client";

import * as React from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import type { Match } from "@/lib/api/types";

import { MatchDetails } from "./matches-details";
import { MatchesList } from "./matches-list";
import { MatchmakingDialog } from "./matchmaking-dialog";
import { RandomMatchesDialog } from "./random-matches-dialog";
import { ScheduleMatchDialog } from "./schedule-match-dialog";
import { useMatchRealtime } from "./use-match-realtime";

type SchedulePrefill = { homeTeamId?: number; awayTeamId?: number } | null;

export function Logistics() {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedMatchId, setSelectedMatchId] = React.useState<number | null>(null);

  /** Incrementa para recarregar lista e detalhe (ações CRUD, matchmaking e realtime). */
  const [refreshKey, setRefreshKey] = React.useState(0);
  /** Cidade da partida selecionada — define o room do Socket.IO. */
  const [realtimeCityId, setRealtimeCityId] = React.useState<number | null>(null);

  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [schedulePrefill, setSchedulePrefill] = React.useState<SchedulePrefill>(null);
  const [randomOpen, setRandomOpen] = React.useState(false);
  const [matchmakingOpen, setMatchmakingOpen] = React.useState(false);

  const refresh = React.useCallback(() => setRefreshKey((value) => value + 1), []);

  const handleSelectMatch = React.useCallback((matchId: number, cityId: number | null) => {
    setSelectedMatchId(matchId);
    if (cityId !== null) setRealtimeCityId(cityId);

    if (window.innerWidth < 1024) {
      setDetailsOpen(true);
    }
  }, []);

  /** Seleciona a primeira partida assim que a lista carrega (espelha o template, que abre no primeiro registo). */
  const handleMatchesLoaded = React.useCallback((matchId: number | null, cityId: number | null) => {
    setSelectedMatchId((current) => current ?? matchId);
    setRealtimeCityId((current) => current ?? cityId);
  }, []);

  const handleDeleted = React.useCallback(() => {
    setSelectedMatchId(null);
    setDetailsOpen(false);
    refresh();
  }, [refresh]);

  const handleMatchCreated = React.useCallback(
    (match: Match) => {
      setSelectedMatchId(match.id);
      if (match.cityId != null) setRealtimeCityId(match.cityId);
      setScheduleOpen(false);
      setSchedulePrefill(null);
      refresh();
    },
    [refresh],
  );

  /** Convite aceite no matchmaking → abre o «Marcar jogo» com as equipas escolhidas. */
  const handleScheduleFromMatchmaking = React.useCallback((homeTeamId: number, awayTeamId: number) => {
    setMatchmakingOpen(false);
    setSchedulePrefill({ homeTeamId, awayTeamId });
    setScheduleOpen(true);
  }, []);

  const handleScheduleOpenChange = React.useCallback((open: boolean) => {
    setScheduleOpen(open);
    if (!open) setSchedulePrefill(null);
  }, []);

  const handleChanged = React.useCallback(() => refresh(), [refresh]);

  /** Tempo real: ligação Socket.IO à cidade da partida selecionada. */
  useMatchRealtime(realtimeCityId, refresh);

  const detailsProps = {
    onChanged: handleChanged,
    onDeleted: handleDeleted,
    refreshKey,
  };

  return (
    <>
      <div
        data-content-padding="false"
        className="grid h-[calc(100dvh-var(--dashboard-header-height))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x"
      >
        <div className="h-full overflow-hidden">
          <MatchesList
            onCreateMatch={() => setScheduleOpen(true)}
            onFindOpponent={() => setMatchmakingOpen(true)}
            onMatchesLoaded={handleMatchesLoaded}
            onSelectMatch={handleSelectMatch}
            onRandomMatches={() => setRandomOpen(true)}
            refreshKey={refreshKey}
            selectedMatchId={selectedMatchId}
          />
        </div>
        <div className="hidden h-full overflow-hidden lg:block">
          <MatchDetails matchId={selectedMatchId} {...detailsProps} />
        </div>
      </div>

      <Sheet onOpenChange={setDetailsOpen} open={detailsOpen}>
        <SheetContent
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-3/4"
          side="right"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{selectedMatchId !== null ? `Partida #${selectedMatchId}` : "Detalhes da partida"}</SheetTitle>
            <SheetDescription>Detalhes da partida selecionada.</SheetDescription>
          </SheetHeader>
          <MatchDetails matchId={selectedMatchId} {...detailsProps} />
        </SheetContent>
      </Sheet>

      <ScheduleMatchDialog
        onCreated={handleMatchCreated}
        onOpenChange={handleScheduleOpenChange}
        open={scheduleOpen}
        prefill={schedulePrefill}
      />
      <RandomMatchesDialog onGenerated={refresh} onOpenChange={setRandomOpen} open={randomOpen} />
      <MatchmakingDialog
        onOpenChange={setMatchmakingOpen}
        onSchedule={handleScheduleFromMatchmaking}
        open={matchmakingOpen}
      />
    </>
  );
}
