import type { Metadata } from "next";

import { getSessionTokens } from "@/lib/auth/session";
import { getStoreCartAction, getStoreCitiesAction } from "@/server/actions/storefront";

import { CheckoutWorkspace } from "../_components/checkout-workspace";

export const metadata: Metadata = { title: "Finalizar compra | Loja Peladeiro" };

export default async function CheckoutPage() {
  const [session, cart, cities] = await Promise.all([getSessionTokens(), getStoreCartAction(), getStoreCitiesAction()]);
  return <CheckoutWorkspace authenticated={Boolean(session.accessToken)} cartResult={cart} citiesResult={cities} />;
}
