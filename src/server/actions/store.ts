"use server";

import {
  adjustStoreStock,
  cancelStoreOrder,
  closeStoreReturn,
  completeStoreOrder,
  confirmStoreOrderPayment,
  createOrderReturn,
  createStoreBrand,
  createStoreCategory,
  createStoreProduct,
  createStoreProductImage,
  createStoreVariant,
  deleteStoreBrand,
  deleteStoreCategory,
  deleteStoreProduct,
  deleteStoreProductImage,
  deleteStoreVariant,
  deliverStoreShipment,
  dispatchStoreShipment,
  getStoreOrder,
  getStoreOrders,
  getStoreProduct,
  getStoreProductImages,
  getStoreReturns,
  inspectStoreReturn,
  prepareStoreShipment,
  processStoreOrder,
  receiveStoreReturn,
  recordStoreReturnRefund,
  reviewStoreReturn,
  updateStoreBrand,
  updateStoreCategory,
  updateStoreProduct,
  updateStoreReturnPolicy,
  updateStoreVariant,
} from "@/lib/api/resources";
import type {
  ActionResult,
  CatalogInput,
  InventoryRow,
  ProductInput,
  StockAdjustInput,
  StoreCatalogItem,
  StoreOrderDetail,
  StoreOrderList,
  StoreOrderRow,
  StoreProduct,
  StoreProductImage,
  StoreReturnPolicy,
  StoreReturnReason,
  StoreReturnRequest,
  StoreShipment,
  VariantInput,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

/**
 * Executa uma chamada de escrita à API com o token da sessão e
 * devolve um resultado legível para os diálogos (`{ ok }` / erro).
 */
async function run<T>(operation: (token: string) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const { accessToken } = await getSessionTokens();
    const data = await operation(accessToken ?? "");
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao comunicar com o servidor.",
    };
  }
}

// ============================================================
// CATEGORIES
// ============================================================

export async function createCategoryAction(input: CatalogInput): Promise<ActionResult<StoreCatalogItem>> {
  return run((token) => createStoreCategory(token, input));
}

export async function updateCategoryAction(
  id: number,
  input: Partial<CatalogInput>,
): Promise<ActionResult<StoreCatalogItem>> {
  return run((token) => updateStoreCategory(token, id, input));
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  return run(async (token) => {
    await deleteStoreCategory(token, id);
  });
}

// ============================================================
// BRANDS
// ============================================================

export async function createBrandAction(input: CatalogInput): Promise<ActionResult<StoreCatalogItem>> {
  return run((token) => createStoreBrand(token, input));
}

export async function updateBrandAction(
  id: number,
  input: Partial<CatalogInput>,
): Promise<ActionResult<StoreCatalogItem>> {
  return run((token) => updateStoreBrand(token, id, input));
}

export async function deleteBrandAction(id: number): Promise<ActionResult> {
  return run(async (token) => {
    await deleteStoreBrand(token, id);
  });
}

// ============================================================
// PRODUCTS
// ============================================================

export async function createProductAction(input: ProductInput): Promise<ActionResult<StoreProduct>> {
  return run((token) => createStoreProduct(token, input));
}

export async function updateProductAction(
  id: number,
  input: Partial<ProductInput>,
): Promise<ActionResult<StoreProduct>> {
  return run((token) => updateStoreProduct(token, id, input));
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  return run(async (token) => {
    await deleteStoreProduct(token, id);
  });
}

// ============================================================
// VARIANTS
// ============================================================

export async function createVariantAction(productId: number, input: VariantInput): Promise<ActionResult<StoreProduct>> {
  return run(async (token) => {
    await createStoreVariant(token, productId, input);
    return getStoreProduct(token, productId);
  });
}

export async function updateVariantAction(
  productId: number,
  variantId: number,
  input: Partial<VariantInput>,
): Promise<ActionResult<StoreProduct>> {
  return run(async (token) => {
    await updateStoreVariant(token, variantId, input);
    return getStoreProduct(token, productId);
  });
}

export async function deleteVariantAction(productId: number, variantId: number): Promise<ActionResult<StoreProduct>> {
  return run(async (token) => {
    await deleteStoreVariant(token, variantId);
    return getStoreProduct(token, productId);
  });
}

// ============================================================
// INVENTORY
// ============================================================

export async function adjustStockAction(
  variantId: number,
  input: StockAdjustInput,
): Promise<ActionResult<InventoryRow>> {
  return run((token) => adjustStoreStock(token, variantId, input));
}

export async function getProductImagesAction(productId: number): Promise<ActionResult<StoreProductImage[]>> {
  return run((token) => getStoreProductImages(token, productId));
}

export async function createProductImageAction(
  productId: number,
  input: { url: string; altText?: string | null },
): Promise<ActionResult<StoreProductImage>> {
  return run((token) => createStoreProductImage(token, productId, input));
}

export async function deleteProductImageAction(imageId: number): Promise<ActionResult> {
  return run((token) => deleteStoreProductImage(token, imageId));
}

export async function getStoreReturnsAction(): Promise<ActionResult<StoreReturnRequest[]>> {
  return run((token) => getStoreReturns(token));
}

export async function createStoreReturnForOrderAction(
  orderId: number,
  input: {
    reason: StoreReturnReason;
    description: string;
    items: Array<{ orderItemId: number; quantity: number }>;
  },
): Promise<ActionResult<StoreReturnRequest>> {
  return run((token) => createOrderReturn(token, orderId, input));
}

export async function updateStoreReturnPolicyAction(
  input: Pick<StoreReturnPolicy, "enabled" | "windowDays" | "allowChangeOfMind">,
): Promise<ActionResult<StoreReturnPolicy>> {
  return run((token) => updateStoreReturnPolicy(token, input));
}

export async function reviewStoreReturnAction(
  id: number,
  input: { decision: "APPROVE" | "REJECT"; note: string },
): Promise<ActionResult<StoreReturnRequest>> {
  return run((token) => reviewStoreReturn(token, id, input));
}

export async function receiveStoreReturnAction(
  id: number,
  input: {
    items: Array<{ orderItemId: number; quantityReceived: number }>;
  },
): Promise<ActionResult<StoreReturnRequest>> {
  return run((token) => receiveStoreReturn(token, id, input));
}

export async function inspectStoreReturnAction(
  id: number,
  input: {
    items: Array<{
      orderItemId: number;
      quantityAccepted: number;
      quantityRestocked: number;
      inspectionNote?: string;
    }>;
  },
): Promise<ActionResult<StoreReturnRequest>> {
  return run((token) => inspectStoreReturn(token, id, input));
}

export async function recordStoreReturnRefundAction(
  id: number,
  input: { method: string; reference: string; note: string },
): Promise<ActionResult<StoreReturnRequest>> {
  return run((token) => recordStoreReturnRefund(token, id, input));
}

export async function closeStoreReturnAction(id: number, note: string): Promise<ActionResult<StoreReturnRequest>> {
  return run((token) => closeStoreReturn(token, id, note));
}

// ============================================================
// ORDERS — encomendas, pagamentos e fulfillment
// ============================================================

/** Listagem de encomendas (admin: todas; utilizador: só as suas). */
export async function listOrdersAction(query?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<StoreOrderList>> {
  return run((token) => getStoreOrders(token, { all: true, ...query }));
}

/** Detalhe completo de uma encomenda (itens, morada, pagamentos, remessa). */
export async function getOrderAction(id: number): Promise<ActionResult<StoreOrderDetail>> {
  return run((token) => getStoreOrder(token, id));
}

/** Confirma o pagamento (manual, sem gateway) — PENDING_PAYMENT → PAID. */
export async function confirmPaymentAction(id: number): Promise<ActionResult<StoreOrderDetail>> {
  return run((token) => confirmStoreOrderPayment(token, id));
}

/** Cancela uma encomenda — liberta reserva ou repõe stock + estorna. */
export async function cancelOrderAction(id: number, reason?: string): Promise<ActionResult<StoreOrderDetail>> {
  return run((token) => cancelStoreOrder(token, id, reason));
}

/** Move a encomenda PAID → PROCESSING. */
export async function processOrderAction(id: number): Promise<ActionResult<StoreOrderRow>> {
  return run((token) => processStoreOrder(token, id));
}

/** Conclui a encomenda → COMPLETED. */
export async function completeOrderAction(id: number): Promise<ActionResult<StoreOrderRow>> {
  return run((token) => completeStoreOrder(token, id));
}

/** Prepara a remessa de uma encomenda paga. */
export async function prepareShipmentAction(id: number): Promise<ActionResult<StoreShipment>> {
  return run((token) => prepareStoreShipment(token, id));
}

/** Expede a remessa (tracking/transportadora). */
export async function dispatchShipmentAction(
  id: number,
  input: { trackingCode?: string; carrier?: string } = {},
): Promise<ActionResult<StoreShipment>> {
  return run((token) => dispatchStoreShipment(token, id, input));
}

/** Marca a remessa como entregue → encomenda COMPLETED. */
export async function deliverShipmentAction(id: number): Promise<ActionResult<StoreShipment>> {
  return run((token) => deliverStoreShipment(token, id));
}
