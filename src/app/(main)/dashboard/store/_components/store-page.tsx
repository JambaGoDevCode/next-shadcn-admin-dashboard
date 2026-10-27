import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getStoreBrands,
  getStoreCategories,
  getStoreInventory,
  getStoreMetrics,
  getStoreOrders,
  getStoreProducts,
  getStoreReturnPolicy,
  getStoreReturns,
  getStoreStockMovements,
} from "@/lib/api/resources";
import type {
  InventoryRow,
  StockMovement,
  StoreCatalogItem,
  StoreMetrics,
  StoreOrderRow,
  StoreProduct,
  StoreReturnPolicy,
  StoreReturnRequest,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { ReturnsSection } from "./returns-section";
import { type StoreSection, StoreWorkspace } from "./store-workspace";

interface StoreData {
  metrics: StoreMetrics;
  products: StoreProduct[];
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  inventory: InventoryRow[];
  movements: StockMovement[];
  orders: StoreOrderRow[];
}

const SECTION_COPY: Record<StoreSection, { title: string; description: string }> = {
  overview: {
    title: "Gestão da loja",
    description: "Visão geral do catálogo, stock e operações comerciais do Peladeiro.",
  },
  products: {
    title: "Produtos",
    description: "Criar, pesquisar, editar e publicar os produtos da loja.",
  },
  categories: {
    title: "Categorias",
    description: "Organizar os produtos pelas famílias do catálogo.",
  },
  brands: {
    title: "Marcas",
    description: "Gerir as marcas comercializadas e associadas aos produtos.",
  },
  variants: {
    title: "Variantes",
    description: "Gerir tamanhos, cores, modelos, SKU, preços e disponibilidade vendável.",
  },
  images: {
    title: "Imagens e descrições",
    description: "Manter a imagem principal, a galeria e a informação comercial dos produtos.",
  },
  inventory: {
    title: "Inventário e stock",
    description: "Consultar quantidades físicas, reservadas, disponíveis e alertas de reposição.",
  },
  movements: {
    title: "Movimentos de stock",
    description: "Auditar entradas, saídas, contagens, devoluções e perdas com os respetivos motivos.",
  },
  orders: {
    title: "Encomendas",
    description: "Consultar compras, itens, clientes, totais, pagamentos e estado.",
  },
  expedicao: {
    title: "Preparação e expedição",
    description: "Acompanhar o processamento, preparação, envio e entrega das encomendas.",
  },
  devolucoes: {
    title: "Devoluções e reembolsos",
    description: "Gerir a política, autorizar devoluções, inspecionar artigos e auditar reembolsos.",
  },
};

export async function StorePage({ section }: { section: StoreSection }) {
  const copy = SECTION_COPY[section];

  if (section === "devolucoes") {
    const { accessToken } = await getSessionTokens();
    const token = accessToken ?? "";
    let policy: StoreReturnPolicy | null = null;
    let requests: StoreReturnRequest[] = [];
    let error: string | null = null;

    try {
      [policy, requests] = await Promise.all([getStoreReturnPolicy(token), getStoreReturns(token)]);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Erro ao carregar as devoluções.";
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl text-foreground leading-none tracking-tight">{copy.title}</h1>
          <p className="text-lg text-muted-foreground leading-none">{copy.description}</p>
        </div>
        {error || !policy ? (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar as devoluções</AlertTitle>
            <AlertDescription>{error ?? "A API não devolveu a política da loja."}</AlertDescription>
          </Alert>
        ) : (
          <ReturnsSection initialPolicy={policy} initialRequests={requests} />
        )}
      </div>
    );
  }

  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let data: StoreData | null = null;
  let error: string | null = null;

  try {
    const [metrics, products, categories, brands, inventory, movements, orderList] = await Promise.all([
      getStoreMetrics(token),
      getStoreProducts(token),
      getStoreCategories(token),
      getStoreBrands(token),
      getStoreInventory(token),
      getStoreStockMovements(token, 200),
      getStoreOrders(token, { all: true, limit: 100 }),
    ]);
    data = { metrics, products, categories, brands, inventory, movements, orders: orderList.items };
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Erro ao carregar os dados da loja.";
  }

  const retryUrl = section === "overview" ? "/dashboard/store" : `/dashboard/store/${section}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">{copy.title}</h1>
        <p className="text-lg text-muted-foreground leading-none">{copy.description}</p>
      </div>

      {error || !data ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-8">
          <p className="text-destructive text-sm">Não foi possível carregar a loja: {error}</p>
          <Link className="text-primary text-sm underline underline-offset-4" href={retryUrl}>
            Tentar novamente
          </Link>
        </div>
      ) : (
        <StoreWorkspace
          section={section}
          metrics={data.metrics}
          products={data.products}
          categories={data.categories}
          brands={data.brands}
          inventory={data.inventory}
          movements={data.movements}
          orders={data.orders}
        />
      )}
    </div>
  );
}
