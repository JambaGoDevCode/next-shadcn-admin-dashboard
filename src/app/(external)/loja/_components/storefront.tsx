"use client";

import * as React from "react";

import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoreCatalogItem } from "@/lib/api/types";
import type { PublicStoreProduct, StorefrontResult } from "@/server/actions/storefront";
import { getStoreProductFallbackImage } from "../../_components/store-product-image";

import { PublicFooter, PublicHeader } from "../../_components/public-chrome";

interface Catalog {
  products: PublicStoreProduct[];
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(price);
}

function productPrice(product: PublicStoreProduct): number {
  const prices = product.variants.map((variant) => variant.price ?? product.price);
  return prices.length ? Math.min(...prices) : product.price;
}

function ProductCard({ product }: { product: PublicStoreProduct }) {
  const available = product.variants.some((variant) => variant.available > 0);
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/loja/produtos/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image src={product.imageUrl ?? getStoreProductFallbackImage(product)} alt={product.name} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          {!available && <Badge variant="secondary" className="absolute top-3 left-3">Indisponível</Badge>}
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">{product.categoryName ?? "Equipamento desportivo"}{product.brandName ? ` · ${product.brandName}` : ""}</p>
          <h2 className="mt-1 line-clamp-2 min-h-10 font-medium leading-5">{product.name}</h2>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-base font-semibold">{formatPrice(productPrice(product))}</span>
            <span className="flex size-8 items-center justify-center rounded-full border transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight className="size-4" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function Storefront({ result }: { result: StorefrontResult<Catalog> }) {
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<number | null>(null);
  const [brandId, setBrandId] = React.useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = React.useState(false);
  const [size, setSize] = React.useState("");
  const [color, setColor] = React.useState("");
  const [minimum, setMinimum] = React.useState("");
  const [maximum, setMaximum] = React.useState("");
  const [sort, setSort] = React.useState("relevant");
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const catalog = result.ok ? result.data : null;
  const products = React.useMemo(() => {
    const filtered = (catalog?.products ?? []).filter((product) => {
      const query = search.trim().toLocaleLowerCase("pt-PT");
      const matchesSearch = !query || `${product.name} ${product.description ?? ""} ${product.brandName ?? ""}`.toLocaleLowerCase("pt-PT").includes(query);
      const matchesCategory = categoryId === null || product.categoryId === categoryId;
      const matchesBrand = brandId === null || product.brandId === brandId;
      const matchesAvailability = !availableOnly || product.variants.some((variant) => variant.available > 0);
      const matchesSize = !size || product.variants.some((variant) => variant.size === size && variant.available > 0);
      const matchesColor = !color || product.variants.some((variant) => variant.color === color && variant.available > 0);
      const price = productPrice(product);
      const matchesMin = !minimum || price >= Number(minimum);
      const matchesMax = !maximum || price <= Number(maximum);
      return matchesSearch && matchesCategory && matchesBrand && matchesAvailability && matchesSize && matchesColor && matchesMin && matchesMax;
    });
    if (sort === "price-asc") filtered.sort((a, b) => productPrice(a) - productPrice(b));
    if (sort === "price-desc") filtered.sort((a, b) => productPrice(b) - productPrice(a));
    if (sort === "newest") filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered;
  }, [availableOnly, brandId, catalog?.products, categoryId, color, maximum, minimum, search, size, sort]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Início</Link><span>/</span><span className="text-foreground">Loja</span>
        </nav>

        <section className="relative overflow-hidden rounded-3xl border bg-muted/30 px-6 py-9 sm:px-10 sm:py-12">
          <div className="absolute -right-12 -bottom-24 size-72 rounded-full border-[40px] border-emerald-500/10 sm:size-96" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">Loja Peladeiro</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Tudo para o teu desporto, num só lugar.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Descobre bolas, equipamentos, vestuário, calçado e acessórios para treinar, competir e representar a tua equipa.</p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-7 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <div className="flex items-center justify-between lg:mb-4">
              <h2 className="font-semibold">Explorar categorias</h2>
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal /> Filtros <ChevronDown className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} /></Button>
            </div>
            <div className={`${filtersOpen ? "grid" : "hidden"} gap-6 lg:grid`}>
              <div className="grid gap-1">
                <button type="button" onClick={() => setCategoryId(null)} className={`rounded-lg px-3 py-2 text-left text-sm ${categoryId === null ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60"}`}>Todas as categorias</button>
                {catalog?.categories.map((category) => (
                  <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${categoryId === category.id ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60"}`}>
                    {category.name}<span className="text-xs text-muted-foreground">{category.productCount}</span>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} className="size-4 accent-emerald-600" /> Apenas disponíveis</label>
              <label className="grid gap-2 text-sm font-medium">Marca
                <select value={brandId ?? ""} onChange={(event) => setBrandId(event.target.value ? Number(event.target.value) : null)} className="h-9 rounded-lg border bg-background px-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Todas as marcas</option>{catalog?.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">Preço (AOA)</legend>
                <div className="flex gap-2"><Input inputMode="decimal" type="number" min="0" placeholder="Mín." value={minimum} onChange={(event) => setMinimum(event.target.value)} aria-label="Preço mínimo" /><Input inputMode="decimal" type="number" min="0" placeholder="Máx." value={maximum} onChange={(event) => setMaximum(event.target.value)} aria-label="Preço máximo" /></div>
              </fieldset>
              <label className="grid gap-2 text-sm font-medium">Tamanho
                <select value={size} onChange={(event) => setSize(event.target.value)} className="h-9 rounded-lg border bg-background px-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Todos os tamanhos</option>
                  {[...new Set((catalog?.products ?? []).flatMap((product) => product.variants.map((variant) => variant.size).filter((item): item is string => Boolean(item))))].sort().map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">Cor
                <select value={color} onChange={(event) => setColor(event.target.value)} className="h-9 rounded-lg border bg-background px-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Todas as cores</option>
                  {[...new Set((catalog?.products ?? []).flatMap((product) => product.variants.map((variant) => variant.color).filter((item): item is string => Boolean(item))))].sort().map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </aside>

          <section className="min-w-0 flex-1" aria-label="Produtos">
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center">
              <div className="relative flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produtos…" aria-label="Pesquisar produtos" className="h-10 pl-9" /></div>
              <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">Ordenar
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="relevant">Relevância</option><option value="price-asc">Preço crescente</option><option value="price-desc">Preço decrescente</option><option value="newest">Novidades</option>
                </select>
              </label>
            </div>
            {result.ok ? (
              <>
                <div className="flex items-center justify-between py-4 text-sm text-muted-foreground"><span>{products.length} {products.length === 1 ? "produto" : "produtos"}</span>{categoryId !== null && <button type="button" onClick={() => setCategoryId(null)} className="text-foreground underline underline-offset-4">Limpar categoria</button>}</div>
                {products.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-dashed px-5 py-16 text-center"><Search className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-4 font-medium">Não encontrámos produtos</h3><p className="mt-1 text-sm text-muted-foreground">Experimenta alterar a pesquisa ou os filtros.</p><Button variant="link" onClick={() => { setSearch(""); setCategoryId(null); setBrandId(null); setAvailableOnly(false); setSize(""); setColor(""); setMinimum(""); setMaximum(""); }}>Limpar filtros</Button></div>}
              </>
            ) : <div role="alert" className="mt-8 rounded-xl border border-dashed p-8 text-sm text-destructive">{result.error} <Button variant="link" onClick={() => window.location.reload()} className="px-1">Tentar novamente</Button></div>}
          </section>
        </div>
        <div className="mt-16 rounded-2xl border bg-muted/20 p-5 text-sm text-muted-foreground sm:flex sm:items-center sm:justify-between sm:p-6">
          <p>Os preços, variantes e disponibilidade são os do catálogo no momento da consulta.</p><Link href="/auth/v2/login" className="mt-3 inline-flex items-center gap-2 font-medium text-foreground hover:underline sm:mt-0">Acompanhar encomendas <ArrowRight className="size-4" /></Link>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
