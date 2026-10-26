import { getAllTeams, listPlayers } from "@/lib/api/management";
import { getCities, getRecentUsers } from "@/lib/api/resources";
import type { City, Player, RecentUser, Team } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { MembersOverview } from "../_components/members-overview";

interface MembersPageState {
  teams: Team[];
  players: Player[];
  cities: City[];
  users: RecentUser[];
  failed: boolean;
}

export default async function TeamMembersPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let state: MembersPageState = { teams: [], players: [], cities: [], users: [], failed: false };
  try {
    const [teams, players, cities, users] = await Promise.all([
      getAllTeams(token),
      listPlayers(token),
      getCities(token).catch(() => [] as City[]),
      getRecentUsers(token, 100).catch(() => [] as RecentUser[]),
    ]);
    state = { teams, players, cities, users, failed: false };
  } catch {
    state = { ...state, failed: true };
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Membros"
        description="Jogadores, capitães, responsáveis e composição de cada equipa."
        apiFailed={state.failed}
      />
      <MembersOverview
        cities={state.cities}
        failed={state.failed}
        players={state.players}
        teams={state.teams}
        users={state.users}
      />
    </div>
  );
}
