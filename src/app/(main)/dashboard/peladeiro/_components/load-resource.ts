import { getStoreOrders, type StoreOrderQuery } from "@/lib/api/resources";
import type { StoreOrderList } from "@/lib/api/types";

export interface ResourceState<T> {
  data: T | null;
  failed: boolean;
}

/**
 * Lista de encomendas com fallback: `all=true` exige role ADMIN na API e devolve
 * 403 para outros perfis — nesse caso cai para as encomendas do próprio utilizador
 * em vez de propagar o erro para a página.
 */
export async function loadStoreOrders(token: string, query: StoreOrderQuery = {}): Promise<StoreOrderList> {
  if (!query.all) return getStoreOrders(token, query);
  try {
    return await getStoreOrders(token, query);
  } catch {
    return getStoreOrders(token, { ...query, all: false });
  }
}

/**
 * Loads a peladeiro-api resource without failing the page — failures surface as
 * `failed: true` and the sections render their "—" offline state.
 */
export function createLoader(token: string) {
  return async function load<T>(fetcher: (token: string) => Promise<T>): Promise<ResourceState<T>> {
    try {
      return { data: await fetcher(token), failed: false };
    } catch {
      return { data: null, failed: true };
    }
  };
}
