import { getAllTeams } from "@/lib/api/management";
import { getCities, getRecentUsers } from "@/lib/api/resources";
import type { City, RecentUser, Team } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { TeamStatusList } from "../_components/team-status-list";

interface TeamStatusPageState {
  teams: Team[];
  cities: City[];
  users: RecentUser[];
  failed: boolean;
}

export default async function TeamStatusPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let state: TeamStatusPageState = { teams: [], cities: [], users: [], failed: false };
  try {
    const [teams, cities, users] = await Promise.all([
      getAllTeams(token),
      getCities(token).catch(() => [] as City[]),
      getRecentUsers(token, 100).catch(() => [] as RecentUser[]),
    ]);
    state = { teams, cities, users, failed: false };
  } catch {
    state = { ...state, failed: true };
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Estado das equipas"
        description="Equipas activas, inactivas e situações que exijam suspensão por violação."
        apiFailed={state.failed}
      />
      <TeamStatusList cities={state.cities} failed={state.failed} teams={state.teams} users={state.users} />
    </div>
  );
}
