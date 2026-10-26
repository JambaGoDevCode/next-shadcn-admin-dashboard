import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { getPublicStoreCatalogAction, type PublicStoreProduct } from "@/server/actions/storefront";
import { getStoreProductFallbackImage } from "./store-product-image";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(price);
}

function productPrice(product: PublicStoreProduct): number {
  const prices = product.variants.map((variant) => variant.price ?? product.price);
  return prices.length ? Math.min(...prices) : product.price;
}

export async function FeaturedStoreProducts() {
  const result = await getPublicStoreCatalogAction();
  if (!result.ok || result.data.products.length === 0) return null;
  const products = result.data.products.slice(0, 4);

  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">Da loja Peladeiro</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Equipamento para o próximo jogo.</h2></div>
          <Link href="/loja" className="hidden items-center gap-2 text-sm font-medium hover:underline sm:flex">Ver todos <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/loja/produtos/${product.id}`} className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-[4/3] bg-muted"><Image src={product.imageUrl ?? getStoreProductFallbackImage(product)} alt={product.name} fill unoptimized sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-105" /></div>
              <div className="p-4"><p className="truncate text-xs text-muted-foreground">{product.categoryName ?? "Equipamento desportivo"}{product.brandName ? ` · ${product.brandName}` : ""}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium">{product.name}</h3><p className="mt-3 font-semibold">{formatPrice(productPrice(product))}</p></div>
            </Link>
          ))}
        </div>
        <Link href="/loja" className="mt-5 inline-flex items-center gap-2 text-sm font-medium sm:hidden">Ver todos os produtos <ArrowRight className="size-4" /></Link>
      </div>
    </section>
  );
}
