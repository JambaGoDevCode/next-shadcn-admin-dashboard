import type { Metadata } from "next";

import { getSessionTokens } from "@/lib/auth/session";
import { getStoreCartAction } from "@/server/actions/storefront";

import { CartWorkspace } from "../_components/cart-workspace";

export const metadata: Metadata = { title: "Carrinho | Loja Peladeiro" };

export default async function CartPage() {
  const [session, cart] = await Promise.all([getSessionTokens(), getStoreCartAction()]);
  return <CartWorkspace authenticated={Boolean(session.accessToken)} result={cart} />;
}
