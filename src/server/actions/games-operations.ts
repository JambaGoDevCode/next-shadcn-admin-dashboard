"use server";

import {
  createMatchDispute,
  getMatchDisputes,
  getMatches,
  getMatchmakingOperations,
  getTeams,
  resolveMatchDispute,
  validateMatchResult,
} from "@/lib/api/resources";
import type {
  Match,
  MatchDispute,
  MatchDisputeResolutionInput,
  MatchmakingOperations,
  MatchmakingQueueJob,
  MatchmakingSearchAttempt,
  Team,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type GamesOperationsResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type NamedMatch = Match & { homeTeamName: string; awayTeamName: string };
export type NamedSearchAttempt = MatchmakingSearchAttempt & { teamName: string };
export type NamedQueueJob = MatchmakingQueueJob & { teamName: string };
export type NamedInvitation = MatchmakingOperations["invitations"][number] & {
  requesterTeamName: string;
  candidateTeamName: string;
};
export type MatchmakingOperationsView = Omit<MatchmakingOperations, "attempts" | "invitations" | "queue"> & {
  queue: Omit<MatchmakingOperations["queue"], "jobs"> & { jobs: NamedQueueJob[] };
  attempts: NamedSearchAttempt[];
  invitations: NamedInvitation[];
};
export type NamedMatchDispute = MatchDispute & {
  homeTeamName: string;
  awayTeamName: string;
  reportingTeamName: string;
};

async function withSession<T>(operation: (token: string) => Promise<T>): Promise<GamesOperationsResult<T>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Sessão expirada. Inicie sessão novamente." };
    return { ok: true, data: await operation(accessToken) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível concluir a operação.",
    };
  }
}

function enrichMatchNames(matches: Match[], teams: Team[]): NamedMatch[] {
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  return matches.map((match) => ({
    ...match,
    homeTeamName: teamNames.get(match.homeTeamId) ?? `Equipa #${match.homeTeamId}`,
    awayTeamName: teamNames.get(match.awayTeamId) ?? `Equipa #${match.awayTeamId}`,
  }));
}

export async function listChallengesAction(): Promise<GamesOperationsResult<NamedMatch[]>> {
  return withSession(async (token) => {
    const [matches, teams] = await Promise.all([getMatches(token), getTeams(token)]);
    return enrichMatchNames(
      matches.filter((match) => match.status === "SCHEDULED" || match.status === "POSTPONED"),
      teams,
    ).sort((a, b) => new Date(b.matchDate ?? 0).getTime() - new Date(a.matchDate ?? 0).getTime());
  });
}

export async function listResultsAction(): Promise<GamesOperationsResult<NamedMatch[]>> {
  return withSession(async (token) => {
    const [matches, teams] = await Promise.all([getMatches(token), getTeams(token)]);
    return enrichMatchNames(
      matches.filter((match) => match.status === "FINISHED"),
      teams,
    ).sort((a, b) => new Date(b.matchDate ?? 0).getTime() - new Date(a.matchDate ?? 0).getTime());
  });
}

export async function getMatchmakingOperationsAction(): Promise<GamesOperationsResult<MatchmakingOperationsView>> {
  return withSession(async (token) => {
    const [operations, teams] = await Promise.all([getMatchmakingOperations(token), getTeams(token)]);
    const teamNames = new Map(teams.map((team) => [team.id, team.name]));
    return {
      ...operations,
      queue: {
        ...operations.queue,
        jobs: operations.queue.jobs.map((job) => ({
          ...job,
          teamName: teamNames.get(job.teamId) ?? `Equipa #${job.teamId}`,
        })),
      },
      attempts: operations.attempts.map((attempt) => ({
        ...attempt,
        teamName: teamNames.get(attempt.teamId) ?? `Equipa #${attempt.teamId}`,
      })),
      invitations: operations.invitations.map((invitation) => ({
        ...invitation,
        requesterTeamName: teamNames.get(invitation.requesterTeamId) ?? `Equipa #${invitation.requesterTeamId}`,
        candidateTeamName: teamNames.get(invitation.candidateTeamId) ?? `Equipa #${invitation.candidateTeamId}`,
      })),
    };
  });
}

export async function listMatchDisputesAction(): Promise<GamesOperationsResult<NamedMatchDispute[]>> {
  return withSession(async (token) => {
    const [disputes, matches, teams] = await Promise.all([getMatchDisputes(token), getMatches(token), getTeams(token)]);
    const namedMatches = new Map(enrichMatchNames(matches, teams).map((match) => [match.id, match]));
    const teamNames = new Map(teams.map((team) => [team.id, team.name]));
    return disputes.map((dispute) => {
      const match = namedMatches.get(dispute.matchId);
      return {
        ...dispute,
        homeTeamName: match?.homeTeamName ?? `Equipa #${match?.homeTeamId ?? "?"}`,
        awayTeamName: match?.awayTeamName ?? `Equipa #${match?.awayTeamId ?? "?"}`,
        reportingTeamName: teamNames.get(dispute.reportingTeamId) ?? `Equipa #${dispute.reportingTeamId}`,
      };
    });
  });
}

export async function validateMatchResultAction(matchId: number): Promise<GamesOperationsResult<Match>> {
  return withSession((token) => validateMatchResult(token, matchId));
}

export async function resolveMatchDisputeAction(
  disputeId: number,
  input: MatchDisputeResolutionInput,
): Promise<GamesOperationsResult<MatchDispute>> {
  return withSession((token) => resolveMatchDispute(token, disputeId, input));
}

export async function fileMatchDisputeAction(
  matchId: number,
  teamId: number,
  category: "RESULT" | "CONDUCT",
  reason: string,
  evidenceUrl?: string,
): Promise<GamesOperationsResult<MatchDispute>> {
  return withSession((token) =>
    createMatchDispute(token, matchId, {
      teamId,
      category,
      reason,
      ...(evidenceUrl ? { evidenceUrl } : {}),
    }),
  );
}
