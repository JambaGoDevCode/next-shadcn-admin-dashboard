"use client";

import * as React from "react";

import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoreProduct, StoreProductImage } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { createProductImageAction, deleteProductImageAction, getProductImagesAction } from "@/server/actions/store";

interface ProductImagesSectionProps {
  products: StoreProduct[];
  onEditProduct: (product: StoreProduct) => void;
}

export function ProductImagesSection({ products, onEditProduct }: ProductImagesSectionProps) {
  const [product, setProduct] = React.useState<StoreProduct | null>(null);
  const [images, setImages] = React.useState<StoreProductImage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [altText, setAltText] = React.useState("");
  const [imageToDelete, setImageToDelete] = React.useState<StoreProductImage | null>(null);

  React.useEffect(() => {
    if (!product) return;

    let active = true;
    setLoading(true);
    setLoadError(null);
    setImages([]);

    void getProductImagesAction(product.id).then((result) => {
      if (!active) return;
      setLoading(false);

      if (!result.ok) {
        setLoadError(result.error);
        toast.error(result.error);
        return;
      }

      setImages(result.data ?? []);
    });

    return () => {
      active = false;
    };
  }, [product]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || saving) return;

    const normalizedUrl = url.trim();
    if (!normalizedUrl) {
      toast.error("Informe o endereço da imagem.");
      return;
    }

    setSaving(true);
    const result = await createProductImageAction(product.id, {
      url: normalizedUrl,
      altText: altText.trim() || null,
    });
    setSaving(false);

    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : result.error);
      return;
    }

    setImages((current) => [...current, result.data].sort((a, b) => a.position - b.position));
    setUrl("");
    setAltText("");
    toast.success("Imagem adicionada à galeria.");
  }

  async function handleDelete() {
    if (!imageToDelete) return;

    const result = await deleteProductImageAction(imageToDelete.id);
    setImageToDelete(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setImages((current) => current.filter((image) => image.id !== imageToDelete.id));
    toast.success("Imagem removida.");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Imagens e descrições</CardTitle>
            <CardDescription>
              A imagem principal e a descrição são editadas no produto; aqui gere a galeria de imagens adicional.
            </CardDescription>
          </div>
          <CardAction>
            <Badge variant="secondary">
              {products.length} {plural(products.length, "produto", "produtos")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ImagePlus />
                </EmptyMedia>
                <EmptyTitle>Sem produtos</EmptyTitle>
                <EmptyDescription>Crie um produto antes de gerir as imagens da galeria.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Imagem principal</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-48 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground text-xs">
                      {item.imageUrl ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground text-xs">
                      {item.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProduct(null);
                            onEditProduct(item);
                          }}
                        >
                          <Pencil data-icon="inline-start" />
                          Editar dados
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setProduct(item)}>
                          <ImagePlus data-icon="inline-start" />
                          Galeria
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={product !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProduct(null);
            setUrl("");
            setAltText("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Galeria de imagens</DialogTitle>
            <DialogDescription>
              {product ? `Imagens adicionais de ${product.name}.` : "Selecione um produto para gerir a galeria."}
            </DialogDescription>
          </DialogHeader>

          {product ? (
            <div className="flex flex-col gap-6">
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="store-image-url">URL da imagem</FieldLabel>
                    <Input
                      id="store-image-url"
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://..."
                      maxLength={500}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="store-image-alt">Texto alternativo</FieldLabel>
                    <Input
                      id="store-image-alt"
                      value={altText}
                      onChange={(event) => setAltText(event.target.value)}
                      placeholder="Descrição acessível da imagem"
                      maxLength={150}
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" className="self-start" disabled={saving}>
                  {saving ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <ImagePlus data-icon="inline-start" />
                  )}
                  Adicionar imagem
                </Button>
              </form>

              {loading ? (
                <p className="text-muted-foreground text-sm">A carregar imagens...</p>
              ) : loadError ? (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível carregar a galeria</AlertTitle>
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              ) : images.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ImagePlus />
                    </EmptyMedia>
                    <EmptyTitle>Galeria vazia</EmptyTitle>
                    <EmptyDescription>Adicione imagens adicionais para apresentar melhor o produto.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent />
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Texto alternativo</TableHead>
                      <TableHead className="text-right">Posição</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {images.map((image) => (
                      <TableRow key={image.id}>
                        <TableCell className="max-w-80 truncate text-xs">
                          <span title={image.url}>{image.url}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{image.altText ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{image.position}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            aria-label={`Remover imagem ${image.url}`}
                            title="Remover imagem"
                            onClick={() => setImageToDelete(image)}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProduct(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={imageToDelete !== null} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem será removida da galeria deste produto. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover imagem</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
