import { notFound, redirect } from "next/navigation";

import { getSessionTokens } from "@/lib/auth/session";
import { getStoreOrderAction } from "@/server/actions/storefront";

import { OrderStatusWorkspace } from "../../_components/order-status-workspace";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();
  const path = `/loja/encomendas/${orderId}`;
  const session = await getSessionTokens();
  if (!session.accessToken) redirect(`/auth/v2/login?returnTo=${encodeURIComponent(path)}`);
  const result = await getStoreOrderAction(orderId);
  if (!result.ok) notFound();
  return <OrderStatusWorkspace initialDetail={result.data} />;
}
