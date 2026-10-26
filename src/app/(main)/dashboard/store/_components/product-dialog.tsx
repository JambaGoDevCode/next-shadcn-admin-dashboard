"use client";

import * as React from "react";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { ProductStatus, StoreCatalogItem, StoreProduct, StoreVariant } from "@/lib/api/types";
import { formatKz } from "@/lib/format";
import {
  createProductAction,
  createVariantAction,
  deleteProductAction,
  deleteVariantAction,
  updateProductAction,
  updateVariantAction,
} from "@/server/actions/store";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` abre em modo criação; com produto abre em modo edição. */
  product: StoreProduct | null;
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  /** Fecha com `null` (remoção) ou mantém aberto com dados frescos. */
  onSaved: (product: StoreProduct | null) => void;
}

const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "ARCHIVED", label: "Arquivado" },
];

const NONE = "none";

interface VariantFormState {
  size: string;
  color: string;
  sku: string;
  price: string;
}

const EMPTY_VARIANT_FORM: VariantFormState = { size: "", color: "", sku: "", price: "" };

/**
 * Diálogo de criação/edição de produto (dados comerciais) com gestão
 * inline de variantes (tamanho/cor/SKU) quando já existe um produto.
 */
export function ProductDialog({ open, onOpenChange, product, categories, brands, onSaved }: ProductDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [status, setStatus] = React.useState<ProductStatus>("ACTIVE");
  const [categoryId, setCategoryId] = React.useState(NONE);
  const [brandId, setBrandId] = React.useState(NONE);

  const [variantForm, setVariantForm] = React.useState<VariantFormState>(EMPTY_VARIANT_FORM);
  const [editingVariantId, setEditingVariantId] = React.useState<number | null>(null);
  const [showVariantForm, setShowVariantForm] = React.useState(false);
  const [variantSaving, setVariantSaving] = React.useState(false);
  const [variantToDelete, setVariantToDelete] = React.useState<StoreVariant | null>(null);
  const [productDeleteOpen, setProductDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    setSaving(false);
    setVariantForm(EMPTY_VARIANT_FORM);
    setEditingVariantId(null);
    setShowVariantForm(false);
    setVariantSaving(false);
    setVariantToDelete(null);
    setProductDeleteOpen(false);

    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPrice(product ? String(product.price) : "");
    setImageUrl(product?.imageUrl ?? "");
    setStatus(product?.status ?? "ACTIVE");
    setCategoryId(product?.categoryId != null ? String(product.categoryId) : NONE);
    setBrandId(product?.brandId != null ? String(product.brandId) : NONE);
  }, [open, product]);

  const startVariantEdit = (variant: StoreVariant) => {
    setEditingVariantId(variant.id);
    setShowVariantForm(true);
    setVariantForm({
      size: variant.size ?? "",
      color: variant.color ?? "",
      sku: variant.sku,
      price: variant.price != null ? String(variant.price) : "",
    });
  };

  const startVariantAdd = () => {
    setEditingVariantId(null);
    setShowVariantForm(true);
    setVariantForm(EMPTY_VARIANT_FORM);
  };

  const cancelVariantForm = () => {
    setEditingVariantId(null);
    setShowVariantForm(false);
    setVariantForm(EMPTY_VARIANT_FORM);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    const trimmedName = name.trim();
    const parsedPrice = Number(price.replace(",", "."));

    if (trimmedName.length < 2) {
      toast.error("O nome do produto precisa de pelo menos 2 caracteres.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Informe um preço válido em Kz (maior que 0).");
      return;
    }

    setSaving(true);

    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      price: parsedPrice,
      imageUrl: imageUrl.trim() || null,
      status,
      categoryId: categoryId === NONE ? null : Number(categoryId),
      brandId: brandId === NONE ? null : Number(brandId),
    };

    const result = product ? await updateProductAction(product.id, payload) : await createProductAction(payload);

    setSaving(false);

    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : result.error);
      return;
    }

    toast.success(product ? "Produto atualizado." : "Produto criado — adicione as variantes.");
    onSaved(result.data);
  }

  async function handleVariantSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!product || variantSaving) return;

    const sku = variantForm.sku.trim().toUpperCase();
    if (sku.length < 2) {
      toast.error("O SKU precisa de pelo menos 2 caracteres.");
      return;
    }

    const trimmedPrice = variantForm.price.trim();
    const parsedPrice = trimmedPrice === "" ? null : Number(trimmedPrice.replace(",", "."));

    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
      toast.error("O preço da variante deve ser maior que 0 (ou vazio para usar o base).");
      return;
    }

    setVariantSaving(true);

    const payload = {
      size: variantForm.size.trim() || null,
      color: variantForm.color.trim() || null,
      sku,
      price: parsedPrice,
    };

    const result =
      editingVariantId === null
        ? await createVariantAction(product.id, payload)
        : await updateVariantAction(product.id, editingVariantId, payload);

    setVariantSaving(false);

    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : result.error);
      return;
    }

    toast.success(editingVariantId === null ? "Variante adicionada." : "Variante atualizada.");
    cancelVariantForm();
    onSaved(result.data);
  }

  async function handleVariantDelete() {
    if (!product || !variantToDelete || variantSaving) return;

    setVariantSaving(true);
    const result = await deleteVariantAction(product.id, variantToDelete.id);
    setVariantSaving(false);
    setVariantToDelete(null);

    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : result.error);
      return;
    }

    toast.success("Variante removida.");
    if (editingVariantId === variantToDelete.id) cancelVariantForm();
    onSaved(result.data);
  }

  async function handleProductDelete() {
    if (!product || saving) return;

    setSaving(true);
    const result = await deleteProductAction(product.id);
    setSaving(false);
    setProductDeleteOpen(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Produto removido.");
    onSaved(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              {product
                ? "Dados comerciais e variantes do produto."
                : "Dados comerciais do catálogo. As variantes são adicionadas a seguir."}
            </DialogDescription>
          </DialogHeader>

          <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="product-name">Nome</Label>
                <Input
                  id="product-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Chuteira Nike Mercurial Vapor XII Pro FG"
                  maxLength={150}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="product-price">Preço base (Kz)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step="any"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="45000"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="product-status">Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ProductStatus)}>
                  <SelectTrigger id="product-status" className="w-full">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="product-category">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="product-category" className="w-full">
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="product-brand">Marca</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger id="product-brand" className="w-full">
                    <SelectValue placeholder="Sem marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem marca</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={String(brand.id)}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="product-image">URL da imagem (opcional)</Label>
                <Input
                  id="product-image"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                  maxLength={500}
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="product-description">Descrição</Label>
                <Textarea
                  id="product-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Detalhes do produto para a ficha comercial."
                  rows={3}
                />
              </div>
            </div>
          </form>

          {product ? (
            <div className="flex flex-col gap-4">
              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">Variantes</p>
                    <p className="text-muted-foreground text-xs">Tamanho, cor e SKU de cada versão vendável.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={startVariantAdd}>
                    <Plus className="size-3.5" />
                    Adicionar
                  </Button>
                </div>

                {product.variants.length > 0 ? (
                  <ul className="divide-y rounded-lg border">
                    {product.variants.map((variant) => (
                      <li key={variant.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm">
                            {variant.size ?? "—"}
                            {variant.color ? ` · ${variant.color}` : ""}
                          </span>
                          <span className="text-muted-foreground truncate font-mono text-xs">{variant.sku}</span>
                        </div>
                        <span className="text-muted-foreground hidden text-xs tabular-nums sm:block">
                          {variant.price != null ? formatKz(variant.price) : `base ${formatKz(product.price)}`}
                        </span>
                        <Badge variant="secondary" className="tabular-nums">
                          {variant.quantity} un.
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Editar variante ${variant.sku}`}
                          title="Editar variante"
                          onClick={() => startVariantEdit(variant)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          aria-label={`Remover variante ${variant.sku}`}
                          title="Remover variante"
                          onClick={() => setVariantToDelete(variant)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
                    Este produto ainda não tem variantes — adicione a primeira.
                  </p>
                )}

                {showVariantForm || product.variants.length === 0 ? (
                  <form
                    onSubmit={handleVariantSubmit}
                    className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="variant-size">Tamanho</Label>
                        <Input
                          id="variant-size"
                          value={variantForm.size}
                          onChange={(event) =>
                            setVariantForm((current) => ({
                              ...current,
                              size: event.target.value,
                            }))
                          }
                          placeholder="40"
                          maxLength={20}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="variant-color">Cor</Label>
                        <Input
                          id="variant-color"
                          value={variantForm.color}
                          onChange={(event) =>
                            setVariantForm((current) => ({
                              ...current,
                              color: event.target.value,
                            }))
                          }
                          placeholder="Preto"
                          maxLength={40}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="variant-sku">SKU</Label>
                        <Input
                          id="variant-sku"
                          value={variantForm.sku}
                          onChange={(event) =>
                            setVariantForm((current) => ({
                              ...current,
                              sku: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="AH7382-107-40"
                          maxLength={60}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="variant-price">Preço (Kz)</Label>
                        <Input
                          id="variant-price"
                          type="number"
                          min={0}
                          step="any"
                          value={variantForm.price}
                          onChange={(event) =>
                            setVariantForm((current) => ({
                              ...current,
                              price: event.target.value,
                            }))
                          }
                          placeholder={`Base ${product.price}`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm" disabled={variantSaving}>
                        {variantSaving ? <Loader2 className="animate-spin" /> : null}
                        {editingVariantId === null ? "Adicionar" : "Guardar"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelVariantForm}
                        disabled={variantSaving}
                      >
                        <X className="size-3.5" />
                        Cancelar
                      </Button>
                      <span className="text-muted-foreground ml-auto text-xs">Preço vazio usa o base do produto.</span>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {product ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setProductDeleteOpen(true)}
                className="sm:mr-auto"
              >
                <Trash2 className="size-3.5" />
                Remover produto
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="product-form" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {product ? "Guardar alterações" : "Criar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={variantToDelete !== null} onOpenChange={(open) => !open && setVariantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover variante?</AlertDialogTitle>
            <AlertDialogDescription>
              A variante <span className="font-mono">{variantToDelete?.sku}</span> e o respetivo stock e histórico de
              movimentos serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleVariantDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={productDeleteOpen} onOpenChange={setProductDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              “{product?.name}” e todas as suas variantes, stock e movimentos serão removidos em cascata. Para produtos
              com histórico de encomendas, prefira arquivar o produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleProductDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
