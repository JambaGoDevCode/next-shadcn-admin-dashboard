import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionTokens } from "@/lib/auth/session";
import {
  getPublicStoreCatalogAction,
  getPublicStoreProductAction,
  getPublicStoreProductImagesAction,
} from "@/server/actions/storefront";

import { ProductDetails } from "../../_components/product-details";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ addVariant?: string; qty?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicStoreProductAction(Number(id));
  return {
    title: result.ok ? `${result.data.name} | Loja Peladeiro` : "Produto | Loja Peladeiro",
    description: result.ok
      ? result.data.description ?? `Consulta preco, variantes e disponibilidade de ${result.data.name}.`
      : "Detalhes de produto da loja desportiva Peladeiro.",
  };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  const [result, imagesResult, catalogResult, session] = await Promise.all([
    getPublicStoreProductAction(productId),
    getPublicStoreProductImagesAction(productId),
    getPublicStoreCatalogAction(),
    getSessionTokens(),
  ]);
  if (!result.ok) notFound();
  const relatedProducts = catalogResult.ok
    ? catalogResult.data.products
        .filter((product) => product.id !== productId && ((result.data.categoryId !== null && product.categoryId === result.data.categoryId) || (result.data.brandId !== null && product.brandId === result.data.brandId)))
        .slice(0, 4)
    : [];
  const resumeVariant = Number(query.addVariant);
  const resumeQuantity = Number(query.qty ?? 1);
  return (
    <ProductDetails
      product={result.data}
      images={imagesResult.ok ? imagesResult.data : []}
      relatedProducts={relatedProducts}
      authenticated={Boolean(session.accessToken)}
      resumeVariantId={Number.isInteger(resumeVariant) && resumeVariant > 0 ? resumeVariant : null}
      resumeQuantity={Number.isInteger(resumeQuantity) && resumeQuantity > 0 ? resumeQuantity : 1}
    />
  );
}
