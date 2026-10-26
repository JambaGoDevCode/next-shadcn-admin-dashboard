"use client";

import * as React from "react";

import type { City, Field, Team } from "@/lib/api/types";
import { getMatchReferenceDataAction } from "@/server/actions/logistics";

export interface MatchReference {
  teams: Team[];
  fields: Field[];
  cities: City[];
}

interface MatchReferenceState {
  data: MatchReference | null;
  loading: boolean;
  error: string | null;
}

/**
 * Carrega equipas, campos e cidades uma única vez enquanto o diálogo está aberto.
 * `retry` volta a tentar após falha; os dados já carregados são reutilizados entre aberturas.
 */
export function useMatchReference(open: boolean): MatchReferenceState & { retry: () => void } {
  const [state, setState] = React.useState<MatchReferenceState>({ data: null, loading: false, error: null });
  const [attempt, setAttempt] = React.useState(0);

  const { data } = state;

  React.useEffect(() => {
    if (!open || data !== null) return;

    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    getMatchReferenceDataAction()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setState({ data: result.data, loading: false, error: null });
        } else {
          setState({ data: null, loading: false, error: result.error });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: "Não foi possível carregar os dados de referência." });
      });

    return () => {
      cancelled = true;
    };
  }, [open, data, attempt]);

  const retry = React.useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
