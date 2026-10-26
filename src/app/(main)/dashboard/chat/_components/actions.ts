"use server";

import { getProfile } from "@/lib/api/auth";
import { apiFetch, extractData } from "@/lib/api/client";
import { getSessionTokens } from "@/lib/auth/session";

export interface ChatConversation {
  id: number;
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  status: "OPEN" | "CLOSED";
  closesAt: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number | null;
  senderTeamId: number | null;
  type: "TEXT" | "VOICE" | "SYSTEM";
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
}

export type ChatResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function withToken<T>(operation: (token: string) => Promise<T>): Promise<ChatResult<T>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Inicie sessão para aceder às conversas." };
    return { ok: true, data: await operation(accessToken) };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "Não foi possível carregar o chat.",
    };
  }
}

export async function getChatDataAction(): Promise<ChatResult<{ userId: number; conversations: ChatConversation[] }>> {
  return withToken(async (token) => {
    const [profile, payload] = await Promise.all([
      getProfile(token),
      apiFetch<unknown>("/chat/conversations", { token }),
    ]);
    return { userId: profile.userId, conversations: extractData<ChatConversation[]>(payload) };
  });
}

export async function getChatMessagesAction(conversationId: number): Promise<ChatResult<ChatMessage[]>> {
  return withToken(async (token) => {
    const payload = await apiFetch<{ messages: ChatMessage[] }>(
      `/chat/conversations/${conversationId}/messages?limit=100`,
      { token },
    );
    return payload.messages;
  });
}

export async function sendChatMessageAction(
  conversationId: number,
  content: string,
): Promise<ChatResult<ChatMessage>> {
  return withToken((token) =>
    apiFetch<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      token,
      body: { content },
    }),
  );
}

export async function markChatReadAction(conversationId: number): Promise<ChatResult<void>> {
  return withToken((token) =>
    apiFetch<void>(`/chat/conversations/${conversationId}/read`, { method: "POST", token }),
  );
}

export async function getChatRealtimeCredentialsAction(): Promise<ChatResult<{ accessToken: string }>> {
  return withToken(async (accessToken) => ({ accessToken }));
}
