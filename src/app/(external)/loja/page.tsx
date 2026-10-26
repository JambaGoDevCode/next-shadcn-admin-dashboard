import type { Metadata } from "next";

import { getPublicStoreCatalogAction } from "@/server/actions/storefront";

import { Storefront } from "./_components/storefront";

export const metadata: Metadata = {
  title: "Loja desportiva | Peladeiro",
  description: "Encontra o equipamento certo para o teu próximo jogo na loja desportiva Peladeiro.",
};

export default async function StorePage() {
  const result = await getPublicStoreCatalogAction();
  return <Storefront result={result} />;
}
