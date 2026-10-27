"use client";

import * as React from "react";

import { Eye, Search, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoreOrderRow } from "@/lib/api/types";
import { formatDateTime, formatKz, orderStatusLabel, orderStatusTone, plural } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os estados" },
  { value: "PENDING_PAYMENT", label: "Pendente de pagamento" },
  { value: "PAID", label: "Paga" },
  { value: "PROCESSING", label: "Em processamento" },
  { value: "COMPLETED", label: "Concluída" },
  { value: "CANCELLED", label: "Cancelada" },
];

interface OrdersSectionProps {
  orders: StoreOrderRow[];
  onView: (order: StoreOrderRow) => void;
  title?: string;
}

/**
 * Listagem de encomendas: pesquisa por número/cliente e filtro por
 * estado. Cada linha abre o detalhe (itens, morada, pagamentos, remessa).
 */
export function OrdersSection({ orders, onView, title = "Encomendas" }: OrdersSectionProps) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const rows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (!term) return true;
      return order.orderNumber.toLowerCase().includes(term) || String(order.userId).includes(term);
    });
  }, [orders, search, status]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Pedidos de compra — estado de pagamento, processamento e remessa.</CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">
            {orders.length} {plural(orders.length, "encomenda", "encomendas")}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Procurar por nº ou cliente..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Procurar encomenda"
            />
          </InputGroup>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Filtrar por estado">
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

        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>Nenhuma encomenda encontrada</EmptyTitle>
              <EmptyDescription>
                {orders.length === 0
                  ? "Assim que existirem pedidos de compra, aparecem aqui."
                  : "Ajuste a pesquisa ou o filtro de estado para ver resultados."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Encomenda</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium tabular-nums">{order.orderNumber}</span>
                      <span className="text-muted-foreground text-xs">Cliente #{order.userId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{order.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatKz(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={orderStatusTone(order.status)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Ver detalhe da encomenda ${order.orderNumber}`}
                      title="Ver detalhe"
                      onClick={() => onView(order)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
