"use client";

import * as React from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicStoreImage, PublicStoreProduct } from "@/server/actions/storefront";
import { addStoreCartItemAction } from "@/server/actions/storefront";
import { getStoreProductFallbackImage } from "../../_components/store-product-image";

import { PublicFooter, PublicHeader } from "../../_components/public-chrome";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(price);
}

export function ProductDetails({
  product,
  images,
  relatedProducts,
  authenticated,
  resumeVariantId,
  resumeQuantity,
}: {
  product: PublicStoreProduct;
  images: PublicStoreImage[];
  relatedProducts: PublicStoreProduct[];
  authenticated: boolean;
  resumeVariantId: number | null;
  resumeQuantity: number;
}) {
  const router = useRouter();
  const [variantId, setVariantId] = React.useState<number | null>(product.variants[0]?.id ?? null);
  const [quantity, setQuantity] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const handledResume = React.useRef(false);
  const gallery = React.useMemo(() => {
    const sources = [
      { id: `primary-${product.id}`, url: product.imageUrl ?? getStoreProductFallbackImage(product), altText: product.name },
      ...images.map((image) => ({ id: String(image.id), url: image.url, altText: image.altText ?? product.name })),
    ];
    return sources.filter((image, index) => sources.findIndex((item) => item.url === image.url) === index);
  }, [images, product.id, product.imageUrl, product.name]);
  const [activeImage, setActiveImage] = React.useState(0);
  const selectedVariant = product.variants.find((variant) => variant.id === variantId) ?? null;
  const available = selectedVariant?.available ?? 0;
  const unitPrice = selectedVariant?.price ?? product.price;

  const addToCart = React.useCallback(async (id: number, qty: number) => {
    setPending(true);
    const result = await addStoreCartItemAction(id, qty);
    setPending(false);
    if (result.ok) {
      toast.success("Produto adicionado ao carrinho.");
      router.push("/loja/carrinho");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }, [router]);

  React.useEffect(() => {
    if (!authenticated || handledResume.current || resumeVariantId === null) return;
    handledResume.current = true;
    const variant = product.variants.find((item) => item.id === resumeVariantId);
    if (variant && variant.available >= resumeQuantity && resumeQuantity > 0) {
      void addToCart(resumeVariantId, resumeQuantity);
    }
  }, [addToCart, authenticated, product.variants, resumeQuantity, resumeVariantId]);

  function handleAdd() {
    if (!selectedVariant) {
      toast.error("Este produto não tem variantes disponíveis para compra.");
      return;
    }
    if (quantity > selectedVariant.available) {
      toast.error("A quantidade selecionada excede a disponibilidade atual.");
      return;
    }
    if (!authenticated) {
      const returnTo = `/loja/produtos/${product.id}?addVariant=${selectedVariant.id}&qty=${quantity}`;
      router.push(`/auth/v2/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    void addToCart(selectedVariant.id, quantity);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Início</Link><span>/</span><Link href="/loja" className="hover:text-foreground">Loja</Link><span>/</span><span className="truncate text-foreground">{product.name}</span>
        </nav>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="grid gap-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted">
              {gallery[activeImage] && <Image src={gallery[activeImage].url} alt={gallery[activeImage].altText} fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />}
            </div>
            {gallery.length > 1 && <div className="flex gap-3 overflow-x-auto pb-1">{gallery.map((image, index) => <button key={image.id} type="button" aria-label={`Ver imagem ${index + 1} de ${gallery.length}`} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)} className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-muted ${activeImage === index ? "border-primary" : "border-transparent"}`}><Image src={image.url} alt="" fill unoptimized sizes="80px" className="object-cover" /></button>)}</div>}
          </div>
          <div className="flex flex-col py-1 lg:py-6">
            <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:text-emerald-400">{product.categoryName ?? "Equipamento desportivo"}{product.brandName ? ` · ${product.brandName}` : ""}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-2xl font-semibold">{formatPrice(unitPrice)}</p>
            {product.description && <p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p>}

            <div className="mt-8 grid gap-5">
              {product.variants.length > 0 ? <label className="grid gap-2 text-sm font-medium">Variante
                <select value={variantId ?? ""} onChange={(event) => setVariantId(Number(event.target.value))} className="h-11 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {product.variants.map((variant) => {
                    const label = [variant.size, variant.color].filter(Boolean).join(" · ") || `Opção ${variant.id}`;
                    return <option key={variant.id} value={variant.id} disabled={variant.available <= 0}>{label}{variant.available <= 0 ? " · Esgotado" : ` · ${variant.available} disponíveis`}</option>;
                  })}
                </select>
              </label> : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Este produto ainda não tem variantes configuradas para compra.</p>}

              <div className="flex items-end justify-between gap-4">
                <label htmlFor="product-quantity" className="grid gap-2 text-sm font-medium">Quantidade
                  <span className="flex h-11 items-center rounded-lg border">
                    <button type="button" className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Diminuir quantidade" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}><Minus className="size-4" /></button>
                    <Input id="product-quantity" type="number" min={1} max={Math.max(1, available)} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(available || 1, Number(event.target.value) || 1)))} className="h-9 w-14 border-0 px-0 text-center shadow-none focus-visible:ring-0" />
                    <button type="button" className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40" aria-label="Aumentar quantidade" onClick={() => setQuantity((value) => Math.min(available || 1, value + 1))} disabled={quantity >= available}><Plus className="size-4" /></button>
                  </span>
                </label>
                <span className={`pb-3 text-xs ${available > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>{available > 0 ? `${available} em stock` : "Sem stock"}</span>
              </div>

              <Button size="lg" className="h-12 rounded-full" disabled={!selectedVariant || available <= 0 || pending} onClick={handleAdd}>
                <ShoppingBag /> {pending ? "A adicionar…" : authenticated ? "Adicionar ao carrinho" : "Entrar para comprar"} <ArrowRight />
              </Button>
            </div>

            <div className="mt-8 grid gap-3 border-t pt-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="size-4 text-emerald-700 dark:text-emerald-400" /> Preço e stock confirmados pela API ao adicionar ao carrinho</p>
              <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-700 dark:text-emerald-400" /> Pagamento e encomenda protegidos pela tua conta</p>
            </div>
            <Link href="/loja" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar à loja</Link>
          </div>
        </div>
        {relatedProducts.length > 0 && <section className="mt-20 border-t pt-10"><div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:text-emerald-400">Continua a explorar</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Também podes gostar</h2></div><Link href="/loja" className="text-sm font-medium hover:underline">Ver loja</Link></div><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{relatedProducts.map((item) => <Link key={item.id} href={`/loja/produtos/${item.id}`} className="group overflow-hidden rounded-2xl border bg-card"><div className="relative aspect-[4/3] bg-muted"><Image src={item.imageUrl ?? getStoreProductFallbackImage(item)} alt={item.name} fill unoptimized sizes="25vw" className="object-cover transition-transform group-hover:scale-105" /></div><div className="p-3"><h3 className="line-clamp-2 min-h-10 text-sm font-medium">{item.name}</h3><p className="mt-2 text-sm font-semibold">{formatPrice(item.price)}</p></div></Link>)}</div></section>}
      </div>
      <PublicFooter />
    </main>
  );
}
