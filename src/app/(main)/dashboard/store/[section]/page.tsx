import { notFound } from "next/navigation";

import { StorePage } from "../_components/store-page";
import type { StoreSection } from "../_components/store-workspace";

const STORE_SECTIONS = [
  "products",
  "categories",
  "brands",
  "variants",
  "images",
  "inventory",
  "movements",
  "orders",
  "expedicao",
  "devolucoes",
] as const satisfies readonly StoreSection[];

const STORE_SECTION_SET = new Set<string>(STORE_SECTIONS);

function isStoreSection(section: string): section is StoreSection {
  return STORE_SECTION_SET.has(section);
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isStoreSection(section)) notFound();

  return <StorePage section={section} />;
}
