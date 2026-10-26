import type { PublicStoreProduct } from "@/server/actions/storefront";

const productImages = {
  footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
  apparel: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=85",
  racquet: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=85",
  football: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=85",
  general: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1000&q=85",
} as const;

export function getStoreProductFallbackImage(product: Pick<PublicStoreProduct, "name" | "categoryName" | "brandName">): string {
  const keywords = `${product.name} ${product.categoryName ?? ""} ${product.brandName ?? ""}`.toLocaleLowerCase("pt-PT");

  if (/sapat|chuteira|calçado|calcado|shoe|boot/.test(keywords)) return productImages.footwear;
  if (/camis|jersey|shirt|roupa|vestuário|vestuario|uniforme/.test(keywords)) return productImages.apparel;
  if (/basquet|basket|bola de basquet/.test(keywords)) return productImages.basketball;
  if (/raquete|racket|padel|pádel|ténis|tenis|squash/.test(keywords)) return productImages.racquet;
  if (/futebol|football|soccer|chuteira|bola/.test(keywords)) return productImages.football;

  return productImages.general;
}
