import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getEcommerceDashboardAction } from "@/server/actions/ecommerce";

import { Inventory } from "./_components/inventory";
import { KpiStrip } from "./_components/kpi-strip";
import { RecentOrders } from "./_components/recent-orders";
import { StoreTraffic } from "./_components/store-traffic";
import { TopCustomers } from "./_components/top-customers";
import { TopProducts } from "./_components/top-products";
import { TrafficSources } from "./_components/traffic-sources";

export default async function Page() {
  const formattedDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt });
  const result = await getEcommerceDashboardAction();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Visão geral da loja</h1>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>
        <div className="grid place-items-center gap-3 rounded-md border border-dashed p-8 text-center text-muted-foreground text-sm">
          <p>{result.error}</p>
          <Button asChild size="sm" variant="outline">
            <a href="/dashboard/ecommerce">Tentar novamente</a>
          </Button>
        </div>
      </div>
    );
  }

  const { overview, recentOrders, customerNames } = result.data;
  const topCustomers = overview.topCustomers.map((customer) => ({
    ...customer,
    name: customerNames[customer.userId],
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Visão geral da loja</h1>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>

        <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-34" id="ecommerce-period" size="sm">
              <SelectValue placeholder="Este mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="this-month">Este mês</SelectItem>
                <SelectItem value="last-month">Mês passado</SelectItem>
                <SelectItem value="last-30-days">Últimos 30 dias</SelectItem>
                <SelectItem value="year-to-date">Ano até à data</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select defaultValue="all-channels">
            <SelectTrigger className="w-40" id="ecommerce-channel" size="sm">
              <SelectValue placeholder="Todos os canais" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-channels">Todos os canais</SelectItem>
                <SelectItem value="online-store">Loja online</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="social">Redes sociais</SelectItem>
                <SelectItem value="retail">Loja física</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" />

          <Button size="icon-sm" variant="outline">
            <Settings2 />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <KpiStrip overview={overview} />
        <div className="xl:col-span-5">
          <StoreTraffic overview={overview} />
        </div>
        <div className="xl:col-span-7">
          <TrafficSources categories={overview.salesByCategory} totalRevenue={overview.revenue.total} />
        </div>
        <div className="xl:col-span-4">
          <TopProducts categories={overview.salesByCategory} products={overview.topProducts} />
        </div>
        <div className="xl:col-span-4">
          <Inventory inventory={overview.inventory} />
        </div>
        <div className="xl:col-span-4">
          <TopCustomers customers={topCustomers} totalCustomers={overview.customers.total} />
        </div>
        <div className="xl:col-span-12">
          <RecentOrders rows={recentOrders} />
        </div>
      </div>
    </div>
  );
}
