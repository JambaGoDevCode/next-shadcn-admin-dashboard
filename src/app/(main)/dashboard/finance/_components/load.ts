export interface LoadState<T> {
  data: T | null;
  failed: boolean;
}

/**
 * Carrega um recurso da peladeiro-api sem partir a página — as falhas ficam
 * registadas em `failed: true` e as secções respectivas mostram «—».
 */
export function createLoader(token: string) {
  return async function load<T>(fetcher: (token: string) => Promise<T>): Promise<LoadState<T>> {
    try {
      return { data: await fetcher(token), failed: false };
    } catch {
      return { data: null, failed: true };
    }
  };
}
