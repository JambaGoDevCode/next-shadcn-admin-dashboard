"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ProductImagesSection } from "./product-images-section";
import { ProductsSection } from "./products-section";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { StockMovementsSection } from "./stock-movements-section";
import { StructureDialog } from "./structure-dialog";
import { StructureSection } from "./structure-section";
import { StoreSummaryCards } from "./summary-cards";
import { VariantsSection } from "./variants-section";

interface StoreWorkspaceProps {
  section: StoreSection;
  metrics: StoreMetrics;
  products: StoreProduct[];
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  inventory: InventoryRow[];
  movements: StockMovement[];
  orders: StoreOrderRow[];
}

export type StoreSection =
  | "overview"
  | "products"
  | "categories"
  | "brands"
  | "variants"
  | "images"
  | "inventory"
  | "movements"
  | "orders"
  | "expedicao"
  | "devolucoes";

type StructureKind = "category" | "brand";

/**
 * Área principal da loja: cada submenu mostra o seu fluxo e os
 * diálogos de escrita recarregam os dados com `router.refresh()`.
 */
export function StoreWorkspace({
  section,
  metrics,
  products,
  categories,
  brands,
  inventory,
  movements,
  orders,
}: StoreWorkspaceProps) {
  const router = useRouter();

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
    setProductDialog((_current) => ({ open: product !== null, product }));
  };

  const handleStructureSaved = (kind: StructureKind) => {
    router.refresh();
    setStructureDialog((current) => ({ ...current, open: false, item: null, kind }));
  };

  const activeOrders =
    section === "expedicao"
      ? orders.filter((order) => order.status === "PAID" || order.status === "PROCESSING")
      : orders;
  const shortcuts = [
    {
      title: "Produtos",
      description: "Gerir publicação, preços, descrições e variantes.",
      href: "/dashboard/store/products",
    },
    {
      title: "Categorias",
      description: "Organizar categorias e marcas comercializadas.",
      href: "/dashboard/store/categories",
    },
    {
      title: "Imagens",
      description: "Manter a imagem principal e a galeria dos produtos.",
      href: "/dashboard/store/images",
    },
    {
      title: "Inventário",
      description: "Consultar disponibilidade, reservas e níveis de stock.",
      href: "/dashboard/store/inventory",
    },
    {
      title: "Movimentos",
      description: "Auditar entradas, saídas, devoluções e perdas.",
      href: "/dashboard/store/movements",
    },
    {
      title: "Encomendas",
      description: "Acompanhar pagamentos e pedidos de compra.",
      href: "/dashboard/store/orders",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {section === "overview" ? <StoreSummaryCards metrics={metrics} /> : null}

      {section === "overview" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map(({ title, description, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="text-primary text-sm">Abrir gestão</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}

      {section === "products" ? (
        <ProductsSection
          products={products}
          categories={categories}
          brands={brands}
          onNew={() => openProductDialog(null)}
          onEdit={openProductDialog}
        />
      ) : null}

      {section === "categories" || section === "brands" ? (
        <StructureSection
          categories={categories}
          brands={brands}
          visibleKinds={section === "categories" ? ["category"] : ["brand"]}
          onNew={(kind) => openStructureDialog(kind, null)}
          onEdit={(kind, item) => openStructureDialog(kind, item)}
          onChanged={handleStructureSaved}
        />
      ) : null}

      {section === "variants" ? <VariantsSection products={products} onEdit={openProductDialog} /> : null}

      {section === "images" ? <ProductImagesSection products={products} onEditProduct={openProductDialog} /> : null}

      {section === "inventory" ? (
        <InventorySection
          inventory={inventory}
          movements={movements}
          showMovements={false}
          onAdjust={openAdjustDialog}
        />
      ) : null}

      {section === "movements" ? <StockMovementsSection movements={movements} /> : null}

      {section === "orders" || section === "expedicao" ? (
        <OrdersSection
          orders={activeOrders}
          title={section === "expedicao" ? "Preparação e expedição" : "Encomendas"}
          onView={(order) => setOrderDialog({ open: true, orderId: order.id })}
        />
      ) : null}

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
