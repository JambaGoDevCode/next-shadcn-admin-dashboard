import {
  getAllTeams,
  getStandings,
  getTournamentRegistrations,
  getTournaments,
} from "@/lib/api/management";
import { getMatches } from "@/lib/api/resources";
import type { Match, Team, Tournament, TournamentRegistration, TournamentStanding } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { TeamPerformance, type StandingsBlock } from "../_components/team-performance";

interface PerformancePageState {
  teams: Team[];
  matches: Match[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  standings: StandingsBlock[];
  failed: boolean;
}

async function loadPerformance(token: string): Promise<PerformancePageState> {
  const [teams, matches, tournaments] = await Promise.all([getAllTeams(token), getMatches(token), getTournaments(token)]);

  const registrationLists = await Promise.all(
    tournaments.map((tournament) => getTournamentRegistrations(token, tournament.id).catch(() => [])),
  );
  const registrations = registrationLists.flat();

  // Só pede classificações a torneios em curso/concluídos — as restantes ainda não podem ter.
  const standingsTournaments = tournaments.filter((tournament) =>
    ["IN_PROGRESS", "FINISHED"].includes(tournament.status),
  );
  const standingsLists = await Promise.all(
    standingsTournaments.map(async (tournament) => {
      const rows = await getStandings(token, tournament.id).catch(() => [] as TournamentStanding[]);
      return { tournament, rows };
    }),
  );

  return {
    teams,
    matches,
    tournaments,
    registrations,
    standings: standingsLists.filter((block) => block.rows.length > 0),
    failed: false,
  };
}

export default async function TeamHistoryPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let state: PerformancePageState = {
    teams: [],
    matches: [],
    tournaments: [],
    registrations: [],
    standings: [],
    failed: false,
  };
  try {
    state = await loadPerformance(token);
  } catch {
    state = { ...state, failed: true };
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Histórico e desempenho"
        description="Jogos, resultados, participação em torneios e classificação."
        apiFailed={state.failed}
      />
      <TeamPerformance
        failed={state.failed}
        matches={state.matches}
        registrations={state.registrations}
        standings={state.standings}
        teams={state.teams}
        tournaments={state.tournaments}
      />
    </div>
  );
}
