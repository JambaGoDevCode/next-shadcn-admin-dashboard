import {
  getStoreBrands,
  getStoreCategories,
  getStoreInventory,
  getStoreMetrics,
  getStoreOrders,
  getStoreProducts,
  getStoreStockMovements,
} from "@/lib/api/resources";
import type {
  InventoryRow,
  StockMovement,
  StoreCatalogItem,
  StoreMetrics,
  StoreOrderRow,
  StoreProduct,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { StoreWorkspace } from "./_components/store-workspace";

interface StoreData {
  metrics: StoreMetrics;
  products: StoreProduct[];
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  inventory: InventoryRow[];
  movements: StockMovement[];
  orders: StoreOrderRow[];
}

export default async function Page() {
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
      getStoreStockMovements(token, 50),
      getStoreOrders(token, { all: true, limit: 100 }),
    ]);
    data = { metrics, products, categories, brands, inventory, movements, orders: orderList.items };
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Erro ao carregar os dados da loja.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-foreground leading-none tracking-tight">Gestão da loja</h1>
        <p className="text-lg text-muted-foreground leading-none">
          Catálogo, stock e operações comerciais do Peladeiro — chuteiras, bolas, proteção e equipamento.
        </p>
      </div>

      {error || !data ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-8">
          <p className="text-destructive text-sm">Não foi possível carregar a loja: {error}</p>
          <a className="text-primary text-sm underline underline-offset-4" href="/dashboard/store">
            Tentar novamente
          </a>
        </div>
      ) : (
        <StoreWorkspace
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
