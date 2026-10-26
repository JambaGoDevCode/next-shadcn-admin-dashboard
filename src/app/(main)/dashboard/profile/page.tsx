import { getCurrentSession, getUserById, getUserProfile } from "@/lib/api/admin";
import { getProfile } from "@/lib/api/auth";
import type { AdminUser, Profile, SessionInfo } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { UserProfileCard } from "../_components/user-profile-card";
import { AccountSummary } from "./_components/account-summary";

export default async function ProfilePage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  async function load<T>(fetcher: () => Promise<T>): Promise<T | null> {
    try {
      return await fetcher();
    } catch {
      return null;
    }
  }

  const profile: Profile | null = await load(() => getProfile(token));
  const user: AdminUser | null = profile ? await load(() => getUserById(token, profile.userId)) : null;
  const session: SessionInfo | null = await load(() => getCurrentSession(token));

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Minha conta</h1>
        <p className="text-muted-foreground text-sm">Seu cadastro, perfil e sessão ativa.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border p-4">
            <AccountSummary user={user} session={session} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border p-4">
            <p className="mb-4 font-medium text-sm">Perfil pessoal</p>
            {profile ? (
              <UserProfileCard userId={profile.userId} profile={profile} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Não foi possível carregar seu perfil. Verifique a conexão com a peladeiro-api.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
