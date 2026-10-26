"use client";

import * as React from "react";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreOverviewCustomer } from "@/lib/api/types";
import { formatKz, plural } from "@/lib/format";

type TopCustomer = StoreOverviewCustomer & {
  name?: string;
};

type TopCustomersProps = {
  customers: TopCustomer[];
  totalCustomers: number;
};

function initialsOf(customer: TopCustomer): string {
  if (customer.name) {
    const parts = customer.name.split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      return parts
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
  }

  return `C${customer.userId}`;
}

export function TopCustomers({ customers, totalCustomers }: TopCustomersProps) {
  const [index, setIndex] = React.useState(0);
  const activeIndex = customers.length > 0 ? index % customers.length : 0;
  const active = customers.length > 0 ? customers[activeIndex] : null;

  function move(step: number) {
    setIndex((current) => (current + step + customers.length) % customers.length);
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Melhores clientes</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {totalCustomers} {plural(totalCustomers, "cliente", "clientes")} com encomendas
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          {active ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="font-medium text-lg text-foreground tabular-nums leading-none tracking-tight">
                  {formatKz(active.revenue)}
                </div>
                <div>
                  <div className="font-medium text-sm">{active.name ?? `Cliente #${active.userId}`}</div>
                  <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">
                    {active.orders} {plural(active.orders, "encomenda concluída", "encomendas concluídas")} · posição{" "}
                    {activeIndex + 1} de {customers.length} por receita no período.
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <Button aria-label="Cliente anterior" onClick={() => move(-1)} size="icon-xs" variant="outline">
                  <ArrowLeft />
                </Button>
                <Button aria-label="Cliente seguinte" onClick={() => move(1)} size="icon-xs" variant="outline">
                  <ArrowRight />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[7em] place-items-center text-center text-muted-foreground text-sm">
              Sem clientes com encomendas no período.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium text-sm">
              {customers.length} {plural(customers.length, "melhor cliente", "melhores clientes")}
            </div>
            <div className="line-clamp-2 min-h-[3em] text-muted-foreground text-xs">
              Ordenados por receita no período
            </div>
          </div>

          <AvatarGroup>
            {customers.map((customer) => (
              <Avatar key={customer.userId}>
                <AvatarFallback>{initialsOf(customer)}</AvatarFallback>
              </Avatar>
            ))}

            {totalCustomers > customers.length && (
              <AvatarGroupCount>+{totalCustomers - customers.length}</AvatarGroupCount>
            )}
          </AvatarGroup>
        </div>
      </CardContent>
    </Card>
  );
}
