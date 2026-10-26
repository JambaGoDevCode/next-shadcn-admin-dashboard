import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";

import type { OrderRow } from "./schema";

function formatOrderDate(date: string) {
  return format(parseISO(date), "HH:mm, d 'de' MMM 'de' yyyy", { locale: pt });
}

function PaymentBadge({ status }: { status: OrderRow["payment"] }) {
  if (status === "Paid") {
    return (
      <Badge
        className="border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300"
        variant="outline"
      >
        <span className="size-1.5 rounded-full bg-current" />
        Pago
      </Badge>
    );
  }

  if (status === "Refunded") {
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-current" />
        Reembolsado
      </Badge>
    );
  }

  return (
    <Badge
      className="border-yellow-700/25 text-yellow-700 dark:border-yellow-300/25 dark:text-yellow-300"
      variant="outline"
    >
      <span className="size-1.5 rounded-full bg-current" />
      Pendente
    </Badge>
  );
}

function FulfillmentBadge({ status }: { status: OrderRow["fulfillment"] }) {
  if (status === "Fulfilled") {
    return (
      <Badge
        className="border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300"
        variant="outline"
      >
        <span className="size-1.5 rounded-full bg-current" />
        Expedida
      </Badge>
    );
  }

  if (status === "Returned") {
    return (
      <Badge variant="destructive">
        <span className="size-1.5 rounded-full bg-current" />
        Devolvida
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <span className="size-1.5 rounded-full bg-current" />
      Por expedir
    </Badge>
  );
}

export const recentOrdersColumns: ColumnDef<DataTableFeatures, OrderRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="w-10">
        <Subscribe
          source={table.atoms.rowSelection}
          selector={() =>
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
          }
        >
          {(checked) => (
            <Checkbox
              aria-label="Selecionar todas as encomendas"
              checked={checked}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
          )}
        </Subscribe>
      </div>
    ),
    cell: ({ row }) => (
      <div className="w-10">
        <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
          {(checked) => (
            <Checkbox
              aria-label={`Selecionar encomenda ${row.original.id}`}
              checked={checked}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
            />
          )}
        </Subscribe>
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: "Encomenda",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <div className="font-medium leading-none">{row.original.id}</div>
        <div className="text-muted-foreground text-xs">{row.original.items}</div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "customer",
    header: "Cliente",
  },
  {
    id: "statusSummary",
    header: "Estado",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <PaymentBadge status={row.original.payment} />
        <FulfillmentBadge status={row.original.fulfillment} />
      </div>
    ),
    filterFn: (row, _columnId, value) => {
      if (value === "Needs action") {
        return (
          row.original.payment === "Pending" ||
          row.original.payment === "Refunded" ||
          row.original.fulfillment === "Unfulfilled" ||
          row.original.fulfillment === "Returned"
        );
      }

      if (value === "Unfulfilled") {
        return row.original.fulfillment === "Unfulfilled";
      }

      if (value === "Unpaid") {
        return row.original.payment === "Pending";
      }

      if (value === "Returns") {
        return row.original.payment === "Refunded" || row.original.fulfillment === "Returned";
      }

      return true;
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="w-28">Total</div>,
    cell: ({ row }) => <div className="w-28 tabular-nums">{row.original.total}</div>,
  },
  {
    accessorKey: "date",
    header: () => <div className="w-44">Data</div>,
    cell: ({ row }) => <div className="w-44 text-muted-foreground">{formatOrderDate(row.original.date)}</div>,
  },
  {
    id: "actions",
    header: () => <div className="flex w-full justify-end">Ações</div>,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex w-full justify-end">
            <Button aria-label="Abrir ações da encomenda" size="icon-sm" variant="ghost">
              <MoreHorizontal />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Ações da encomenda</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>Ver encomenda</DropdownMenuItem>
            <DropdownMenuItem>Contactar cliente</DropdownMenuItem>
            <DropdownMenuItem>Copiar ID da encomenda</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
    enableSorting: false,
  },
];
