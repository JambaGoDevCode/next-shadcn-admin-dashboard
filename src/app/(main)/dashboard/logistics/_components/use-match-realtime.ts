"use client";

import * as React from "react";

import { toast } from "sonner";

import { subscribeMatchEvents } from "@/lib/api/realtime";
import { getRealtimeCredentialsAction } from "@/server/actions/logistics";

/**
 * Liga o Socket.IO do peladeiro-api à cidade indicada (room `city:<cityId>`).
 * Cada evento de partida mostra um toast e força um refresh da lista/detalhe,
 * para que o utilizador veja o jogo em tempo real.
 */
export function useMatchRealtime(cityId: number | null, onRefresh: () => void): void {
  const refreshRef = React.useRef(onRefresh);
  React.useEffect(() => {
    refreshRef.current = onRefresh;
  });

  React.useEffect(() => {
    if (cityId === null) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void getRealtimeCredentialsAction()
      .then((result) => {
        if (disposed) return;
        if (!result.ok) {
          console.warn("[realtime] credenciais indisponíveis:", result.error);
          return;
        }

        cleanup = subscribeMatchEvents(result.data.accessToken, cityId, (event) => {
          toast.info(event.message || "Partida atualizada em tempo real.");
          refreshRef.current();
        });
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        console.warn("[realtime] falha ao obter credenciais:", cause instanceof Error ? cause.message : cause);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [cityId]);
}
