import { io, type Socket } from "socket.io-client";

import type { RealtimeMatchEvent, RealtimeMatchEventName, RealtimeMatchEventType } from "./types";

const MATCH_EVENTS: readonly RealtimeMatchEventName[] = [
  "match:created",
  "match:started",
  "match:score_updated",
  "match:finished",
] as const;

/**
 * Origem do peladeiro-api para o browser.
 * Usa `NEXT_PUBLIC_PELADEIRO_API_URL` quando definido; caso contrário reutiliza o host da página
 * com a porta 3000, para funcionar tanto em `localhost` como em `192.168.x.x`.
 */
function resolveSocketUrl(): string {
  const override = process.env.NEXT_PUBLIC_PELADEIRO_API_URL;
  if (override) return override.replace(/\/$/, "");
  if (typeof window === "undefined") return "http://localhost:3000";
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

/**
 * Liga o Socket.IO do peladeiro-api ao room `city:<cityId>` e devolve a função de desligamento.
 * O servidor valida o JWT em `auth.token` no handshake.
 */
export function subscribeMatchEvents(
  token: string,
  cityId: number,
  onEvent: (event: RealtimeMatchEvent) => void,
): () => void {
  const socket: Socket = io(resolveSocketUrl(), {
    auth: { token, cityId },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelayMax: 10_000,
  });

  for (const name of MATCH_EVENTS) {
    socket.on(name, (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as Partial<RealtimeMatchEvent>;
      onEvent({
        event: name,
        type: (record.type ?? "MATCH_CREATED") as RealtimeMatchEventType,
        message: record.message ?? "",
        data: record.data,
        timestamp: record.timestamp ?? new Date().toISOString(),
      });
    });
  }

  socket.on("connect_error", (error: Error) => {
    // Falhas de auth/expiração do token não podem partir a página — apenas sinalizadas na consola.
    console.warn("[realtime] ligação Socket.IO falhou:", error.message);
  });

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
