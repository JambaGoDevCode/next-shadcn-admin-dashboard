"use server";

import { apiFetch, extractData } from "@/lib/api/client";
import { getCities } from "@/lib/api/resources";
import type {
  City,
  StoreCatalogItem,
  StoreOrderDetail,
  StoreProduct,
  StoreReturnPolicy,
  StoreReturnReason,
  StoreReturnRequest,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export interface PublicStoreProduct
  extends Omit<StoreProduct, "variants" | "variantCount" | "stockUnits" | "updatedAt"> {
  variants: Array<
    Pick<StoreProduct["variants"][number], "id" | "productId" | "size" | "color" | "price" | "available">
  >;
}

export interface StoreCartItem {
  id: number;
  variantId: number;
  quantity: number;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  productName: string;
  imageUrl: string | null;
}

export interface StoreCart {
  id: number;
  status: string;
  totalItems: number;
  items: StoreCartItem[];
  updatedAt: string;
}

export interface PublicStoreImage {
  id: number;
  url: string;
  altText: string | null;
  position: number;
  variantId: number | null;
}

export type StorefrontResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function withSession<T>(operation: (token: string) => Promise<T>): Promise<StorefrontResult<T>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Inicia sessão para continuar com a compra." };
    return { ok: true, data: await operation(accessToken) };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Não foi possível concluir o pedido." };
  }
}

export async function getPublicStoreCatalogAction(): Promise<
  StorefrontResult<{
    products: PublicStoreProduct[];
    categories: StoreCatalogItem[];
    brands: StoreCatalogItem[];
  }>
> {
  try {
    const [products, categories, brands] = await Promise.all([
      apiFetch<PublicStoreProduct[]>("/store/catalog/products"),
      apiFetch<StoreCatalogItem[]>("/store/catalog/categories"),
      apiFetch<StoreCatalogItem[]>("/store/catalog/brands"),
    ]);
    return { ok: true, data: { products, categories, brands } };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Não foi possível carregar o catálogo." };
  }
}

export async function getPublicStoreProductAction(id: number): Promise<StorefrontResult<PublicStoreProduct>> {
  try {
    const product = await apiFetch<PublicStoreProduct>(`/store/catalog/products/${id}`);
    return { ok: true, data: extractData<PublicStoreProduct>(product) };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Produto não encontrado." };
  }
}

export async function getPublicStoreProductImagesAction(id: number): Promise<StorefrontResult<PublicStoreImage[]>> {
  try {
    const images = await apiFetch<PublicStoreImage[]>(`/store/catalog/products/${id}/images`);
    return { ok: true, data: images };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Não foi possível carregar as imagens." };
  }
}

export async function getStoreCartAction(): Promise<StorefrontResult<StoreCart>> {
  return withSession((token) => apiFetch<StoreCart>("/store/carts/me", { token }));
}

export async function addStoreCartItemAction(
  variantId: number,
  quantity: number,
): Promise<StorefrontResult<StoreCart>> {
  return withSession((token) =>
    apiFetch<StoreCart>("/store/carts/items", { method: "POST", token, body: { variantId, quantity } }),
  );
}

export async function updateStoreCartItemAction(
  itemId: number,
  quantity: number,
): Promise<StorefrontResult<StoreCart>> {
  return withSession((token) =>
    apiFetch<StoreCart>(`/store/carts/items/${itemId}`, { method: "PUT", token, body: { quantity } }),
  );
}

export async function removeStoreCartItemAction(itemId: number): Promise<StorefrontResult<StoreCart>> {
  return withSession((token) => apiFetch<StoreCart>(`/store/carts/items/${itemId}`, { method: "DELETE", token }));
}

export async function getStoreCitiesAction(): Promise<StorefrontResult<City[]>> {
  return withSession((token) => getCities(token));
}

export async function getShippingQuoteAction(
  subtotal: number,
): Promise<StorefrontResult<{ amount: number; method: string; freeShipping: boolean }>> {
  return withSession((token) =>
    apiFetch<{ amount: number; method: string; freeShipping: boolean }>(
      `/store/orders/shipping-quote?subtotal=${encodeURIComponent(subtotal)}`,
      { token },
    ),
  );
}

export interface StoreShippingAddress {
  recipientName: string;
  phone: string;
  cityId: number;
  addressLine: string;
  reference?: string;
}

export async function createStoreOrderAction(
  shippingAddress: StoreShippingAddress,
): Promise<StorefrontResult<StoreOrderDetail>> {
  return withSession((token) =>
    apiFetch<StoreOrderDetail>("/store/orders", { method: "POST", token, body: { shippingAddress } }),
  );
}

export async function getStoreOrderAction(orderId: number): Promise<StorefrontResult<StoreOrderDetail>> {
  return withSession((token) => apiFetch<StoreOrderDetail>(`/store/orders/${orderId}`, { token }));
}

export async function getStoreReturnPolicyAction(): Promise<StorefrontResult<StoreReturnPolicy>> {
  return withSession((token) => apiFetch<StoreReturnPolicy>("/store/returns/policy", { token }));
}

export async function getOrderReturnsAction(orderId: number): Promise<StorefrontResult<StoreReturnRequest[]>> {
  return withSession((token) => apiFetch<StoreReturnRequest[]>(`/store/orders/${orderId}/returns`, { token }));
}

export async function createStoreReturnAction(
  orderId: number,
  input: {
    reason: StoreReturnReason;
    description: string;
    items: Array<{ orderItemId: number; quantity: number }>;
  },
): Promise<StorefrontResult<StoreReturnRequest>> {
  return withSession((token) =>
    apiFetch<StoreReturnRequest>(`/store/orders/${orderId}/returns`, {
      method: "POST",
      token,
      body: input,
    }),
  );
}

export async function setStoreReturnTrackingAction(
  id: number,
  input: { carrier: string; trackingCode: string },
): Promise<StorefrontResult<StoreReturnRequest>> {
  return withSession((token) =>
    apiFetch<StoreReturnRequest>(`/store/returns/${id}/tracking`, { method: "PATCH", token, body: input }),
  );
}

export interface StorePaymentResult {
  paymentId: number;
  reference?: string;
  status: string;
  amount: number;
}

export async function createStorePaymentAction(orderId: number): Promise<StorefrontResult<StorePaymentResult>> {
  return withSession((token) =>
    apiFetch<StorePaymentResult>(`/store/orders/${orderId}/payment`, { method: "POST", token }),
  );
}

export async function confirmStorePaymentAction(
  orderId: number,
  paymentId: number,
): Promise<StorefrontResult<StoreOrderDetail>> {
  return withSession((token) =>
    apiFetch<StoreOrderDetail>(`/store/orders/${orderId}/confirm-payment`, {
      method: "POST",
      token,
      body: { paymentId },
    }),
  );
}
