"use server";

import { getMetricsTimeseries } from "@/lib/api/resources";
import type { MetricsTimeseries } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

/**
 * Recarrega as séries temporais do gráfico de atividade
 * quando o usuário muda o período ou a cidade.
 */
export async function fetchTimeseriesAction(days: number, cityId?: number): Promise<MetricsTimeseries | null> {
  const { accessToken } = await getSessionTokens();

  try {
    return await getMetricsTimeseries(accessToken ?? "", days, cityId);
  } catch {
    return null;
  }
}
