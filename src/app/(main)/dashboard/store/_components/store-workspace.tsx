"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  InventoryRow,
  StockMovement,
  StoreCatalogItem,
  StoreMetrics,
  StoreOrderRow,
  StoreProduct,
} from "@/lib/api/types";

import { InventorySection } from "./inventory-section";
import { OrderDialog } from "./order-dialog";
import { OrdersSection } from "./orders-section";
import { ProductDialog } from "./product-dialog";
import { ProductsSection } from "./products-section";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { StructureDialog } from "./structure-dialog";
import { StructureSection } from "./structure-section";
import { StoreSummaryCards } from "./summary-cards";

interface StoreWorkspaceProps {
  metrics: StoreMetrics;
  products: StoreProduct[];
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  inventory: InventoryRow[];
  movements: StockMovement[];
  orders: StoreOrderRow[];
}

type StructureKind = "category" | "brand";

/**
 * Coluna principal da página da loja: mantém o estado partilhado
 * (separadores e diálogos de CRUD) — os dados chegam do servidor na
 * página e são recarregados com `router.refresh()`.
 */
export function StoreWorkspace({
  metrics,
  products,
  categories,
  brands,
  inventory,
  movements,
  orders,
}: StoreWorkspaceProps) {
  const router = useRouter();

  const [tab, setTab] = React.useState("produtos");
  const [productDialog, setProductDialog] = React.useState<{ open: boolean; product: StoreProduct | null }>({
    open: false,
    product: null,
  });
  const [adjustDialog, setAdjustDialog] = React.useState<{ open: boolean; row: InventoryRow | null }>({
    open: false,
    row: null,
  });
  const [structureDialog, setStructureDialog] = React.useState<{
    open: boolean;
    kind: StructureKind;
    item: StoreCatalogItem | null;
  }>({ open: false, kind: "category", item: null });
  const [orderDialog, setOrderDialog] = React.useState<{ open: boolean; orderId: number | null }>({
    open: false,
    orderId: null,
  });

  const openProductDialog = (product: StoreProduct | null) => setProductDialog({ open: true, product });
  const openAdjustDialog = (row: InventoryRow | null) => setAdjustDialog({ open: true, row });

  const openStructureDialog = (kind: StructureKind, item: StoreCatalogItem | null) =>
    setStructureDialog({ open: true, kind, item });

  /**
   * Chamado após gravações de produto/variantes: `product` mantém o
   * diálogo aberto com dados frescos; `null` fecha-o (remoção).
   */
  const handleProductSaved = (product: StoreProduct | null) => {
    router.refresh();
    setProductDialog((current) => ({ open: product !== null, product }));
  };

  const handleStructureSaved = (kind: StructureKind) => {
    router.refresh();
    setStructureDialog((current) => ({ ...current, open: false, item: null, kind }));
  };

  return (
    <div className="flex flex-col gap-6">
      <StoreSummaryCards metrics={metrics} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="inventario">Inventário</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="encomendas">Encomendas</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-4">
          <ProductsSection
            products={products}
            categories={categories}
            brands={brands}
            onNew={() => openProductDialog(null)}
            onEdit={openProductDialog}
          />
        </TabsContent>

        <TabsContent value="inventario" className="mt-4">
          <InventorySection inventory={inventory} movements={movements} onAdjust={openAdjustDialog} />
        </TabsContent>

        <TabsContent value="catalogo" className="mt-4">
          <StructureSection
            categories={categories}
            brands={brands}
            onNew={(kind) => openStructureDialog(kind, null)}
            onEdit={(kind, item) => openStructureDialog(kind, item)}
            onChanged={handleStructureSaved}
          />
        </TabsContent>

        <TabsContent value="encomendas" className="mt-4">
          <OrdersSection orders={orders} onView={(order) => setOrderDialog({ open: true, orderId: order.id })} />
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog((current) => ({ ...current, open }))}
        product={productDialog.product}
        categories={categories}
        brands={brands}
        onSaved={handleProductSaved}
      />

      <StockAdjustDialog
        open={adjustDialog.open}
        onOpenChange={(open) => setAdjustDialog((current) => ({ ...current, open }))}
        row={adjustDialog.row}
        onSaved={() => {
          setAdjustDialog({ open: false, row: null });
          router.refresh();
        }}
      />

      <StructureDialog
        open={structureDialog.open}
        onOpenChange={(open) => setStructureDialog((current) => ({ ...current, open }))}
        kind={structureDialog.kind}
        item={structureDialog.item}
        onSaved={() => handleStructureSaved(structureDialog.kind)}
      />

      <OrderDialog
        open={orderDialog.open}
        onOpenChange={(open) => setOrderDialog((current) => ({ ...current, open }))}
        orderId={orderDialog.orderId}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}
