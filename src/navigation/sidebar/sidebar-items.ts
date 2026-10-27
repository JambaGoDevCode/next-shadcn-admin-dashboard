import {
  Activity,
  ArrowRightLeft,
  Banknote,
  Boxes,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChartBar,
  ChartNoAxesCombined,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  Fingerprint,
  Flag,
  FolderOpen,
  Gauge,
  Gavel,
  Goal,
  GraduationCap,
  HeartPulse,
  History,
  Image,
  Inbox,
  Kanban,
  LandPlot,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  ListOrdered,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  Package,
  Percent,
  PersonStanding,
  ReceiptText,
  RotateCcw,
  Scale,
  Search,
  Server,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SquareArrowUpRight,
  Store,
  Swords,
  Tag,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Truck,
  Undo2,
  UserCog,
  UserRound,
  Users,
  UsersRound,
  UserX,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        id: "default",
        title: "Default",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "peladeiro",
        title: "Peladeiro Dashboard",
        icon: Goal,
        badge: "new",
        subItems: [
          {
            id: "peladeiro-overview",
            title: "Visão geral",
            url: "/dashboard/peladeiro",
            icon: Eye,
          },
          {
            id: "peladeiro-activity",
            title: "Atividade recente",
            url: "/dashboard/peladeiro/atividade",
            icon: Activity,
          },
          {
            id: "peladeiro-finance",
            title: "Indicadores financeiros",
            url: "/dashboard/peladeiro/financeiro",
            icon: Banknote,
          },
          {
            id: "peladeiro-alerts",
            title: "Alertas e pendências",
            url: "/dashboard/peladeiro/alertas",
            icon: TriangleAlert,
          },
          {
            id: "peladeiro-performance",
            title: "Desempenho",
            url: "/dashboard/peladeiro/desempenho",
            icon: TrendingUp,
          },
        ],
      },
      {
        id: "crm",
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        id: "finance",
        title: "Financeiro",
        icon: Banknote,
        subItems: [
          {
            id: "finance-overview",
            title: "Visão financeira",
            url: "/dashboard/finance",
            icon: ChartNoAxesCombined,
          },
          {
            id: "finance-transactions",
            title: "Transações",
            url: "/dashboard/finance/transacoes",
            icon: ArrowRightLeft,
          },
          {
            id: "finance-bookings",
            title: "Reservas e pagamentos",
            url: "/dashboard/finance/reservas",
            icon: CalendarCheck,
          },
          {
            id: "finance-store",
            title: "Loja e pagamentos",
            url: "/dashboard/finance/loja",
            icon: Store,
          },
          {
            id: "finance-commissions",
            title: "Comissões",
            url: "/dashboard/finance/comissoes",
            icon: Percent,
          },
          {
            id: "finance-refunds",
            title: "Reembolsos",
            url: "/dashboard/finance/reembolsos",
            icon: Undo2,
          },
          {
            id: "finance-reconciliation",
            title: "Reconciliação",
            url: "/dashboard/finance/reconciliacao",
            icon: Scale,
          },
          {
            id: "finance-reports",
            title: "Relatórios financeiros",
            url: "/dashboard/finance/relatorios",
            icon: FileSpreadsheet,
          },
        ],
      },
      {
        id: "analytics",
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: Gauge,
      },
      {
        id: "productivity",
        title: "Productivity",
        url: "/dashboard/productivity",
        icon: ListTodo,
      },
      {
        id: "store",
        title: "Loja",
        icon: Store,
        badge: "new",
        subItems: [
          {
            id: "store-overview",
            title: "Visão geral",
            url: "/dashboard/store",
            icon: LayoutDashboard,
          },
          {
            id: "store-products",
            title: "Produtos",
            url: "/dashboard/store/products",
            icon: Package,
          },
          {
            id: "store-categories",
            title: "Categorias",
            url: "/dashboard/store/categories",
            icon: Boxes,
          },
          {
            id: "store-brands",
            title: "Marcas",
            url: "/dashboard/store/brands",
            icon: Tag,
          },
          {
            id: "store-variants",
            title: "Variantes",
            url: "/dashboard/store/variants",
            icon: Layers,
          },
          {
            id: "store-images",
            title: "Imagens e descrições",
            url: "/dashboard/store/images",
            icon: Image,
          },
          {
            id: "store-inventory",
            title: "Inventário e stock",
            url: "/dashboard/store/inventory",
            icon: Boxes,
          },
          {
            id: "store-movements",
            title: "Movimentos de stock",
            url: "/dashboard/store/movements",
            icon: History,
          },
          {
            id: "store-orders",
            title: "Encomendas",
            url: "/dashboard/store/orders",
            icon: ShoppingBag,
          },
          {
            id: "store-fulfillment",
            title: "Preparação e expedição",
            url: "/dashboard/store/expedicao",
            icon: Truck,
          },
          {
            id: "store-returns",
            title: "Devoluções e reembolsos",
            url: "/dashboard/store/devolucoes",
            icon: RotateCcw,
          },
        ],
      },
      {
        id: "ecommerce",
        title: "E-commerce",
        url: "/dashboard/ecommerce",
        icon: ShoppingBag,
      },
      {
        id: "academy",
        title: "Academy",
        url: "/dashboard/academy",
        icon: GraduationCap,
      },
      {
        id: "infrastructure",
        title: "Infrastructure",
        url: "/dashboard/infrastructure",
        icon: Server,
      },
      {
        id: "file-manager",
        title: "File Manager",
        url: "/dashboard/file-manager",
        icon: FolderOpen,
        badge: "new",
      },
      {
        id: "patient-monitoring",
        title: "Patient Monitoring",
        url: "/dashboard/patient-monitoring",
        icon: HeartPulse,
        badge: "new",
      },
    ],
  },
  {
    id: 5,
    label: "Gestão",
    items: [
      {
        id: "cities",
        title: "Cidades",
        url: "/dashboard/cities",
        icon: MapPin,
      },
      {
        id: "fields",
        title: "Campos desportivos",
        icon: LandPlot,
        subItems: [
          {
            id: "fields-all",
            title: "Todos os campos",
            url: "/dashboard/fields",
            icon: LayoutGrid,
          },
          {
            id: "fields-approval",
            title: "Aprovação de campos",
            url: "/dashboard/fields/aprovacao",
            icon: ClipboardCheck,
          },
          {
            id: "fields-owners",
            title: "Proprietários e responsáveis",
            url: "/dashboard/fields/proprietarios",
            icon: UserCog,
          },
          {
            id: "fields-quality",
            title: "Qualidade dos campos",
            url: "/dashboard/fields/qualidade",
            icon: Sparkles,
          },
          {
            id: "fields-availability",
            title: "Disponibilidade",
            url: "/dashboard/fields/disponibilidade",
            icon: CalendarClock,
          },
          {
            id: "fields-reviews",
            title: "Avaliações e denúncias",
            url: "/dashboard/fields/avaliacoes",
            icon: MessageSquareWarning,
          },
        ],
      },
      {
        id: "reservations",
        title: "Reservas",
        icon: CalendarDays,
        subItems: [
          {
            id: "reservations-all",
            title: "Todas as reservas",
            url: "/dashboard/reservas",
            icon: ClipboardList,
          },
          {
            id: "reservations-pending",
            title: "Pendentes",
            url: "/dashboard/reservas/pendentes",
            icon: CalendarClock,
          },
          {
            id: "reservations-confirmed",
            title: "Confirmadas",
            url: "/dashboard/reservas/confirmadas",
            icon: ClipboardCheck,
          },
          {
            id: "reservations-cancellations",
            title: "Cancelamentos",
            url: "/dashboard/reservas/cancelamentos",
            icon: History,
          },
          {
            id: "reservations-conflicts",
            title: "Conflitos e incidentes",
            url: "/dashboard/reservas/conflitos",
            icon: TriangleAlert,
          },
          {
            id: "reservations-calendar",
            title: "Calendário",
            url: "/dashboard/reservas/calendario",
            icon: Calendar,
          },
        ],
      },
      {
        id: "games-and-challenges",
        title: "Jogos e desafios",
        icon: Swords,
        subItems: [
          {
            id: "games-all",
            title: "Todos os jogos",
            url: "/dashboard/logistics",
            icon: CalendarDays,
          },
          {
            id: "games-challenges",
            title: "Desafios",
            url: "/dashboard/jogos-e-desafios/desafios",
            icon: MessageSquare,
          },
          {
            id: "games-matchmaking",
            title: "Procura de adversários",
            url: "/dashboard/jogos-e-desafios/procura-de-adversarios",
            icon: Search,
          },
          {
            id: "games-results",
            title: "Resultados",
            url: "/dashboard/jogos-e-desafios/resultados",
            icon: ClipboardCheck,
          },
          {
            id: "games-disputes",
            title: "Disputas",
            url: "/dashboard/jogos-e-desafios/disputas",
            icon: Gavel,
          },
        ],
      },
      {
        id: "players",
        title: "Jogadores",
        url: "/dashboard/players",
        icon: PersonStanding,
      },
      {
        id: "teams",
        title: "Equipas",
        icon: Shield,
        subItems: [
          {
            id: "teams-all",
            title: "Todas as equipas",
            url: "/dashboard/teams",
            icon: Goal,
          },
          {
            id: "teams-members",
            title: "Membros",
            url: "/dashboard/teams/membros",
            icon: UsersRound,
          },
          {
            id: "teams-requests",
            title: "Pedidos e convites",
            url: "/dashboard/teams/pedidos",
            icon: Inbox,
          },
          {
            id: "teams-status",
            title: "Estado das equipas",
            url: "/dashboard/teams/estado",
            icon: ShieldCheck,
          },
          {
            id: "teams-history",
            title: "Histórico e desempenho",
            url: "/dashboard/teams/historico",
            icon: TrendingUp,
          },
        ],
      },
      {
        id: "championships",
        title: "Torneios e competições",
        icon: Trophy,
        subItems: [
          {
            id: "championships-main",
            title: "Todos os torneios",
            url: "/dashboard/championships",
            icon: Trophy,
          },
          {
            id: "championships-approvals",
            title: "Aprovação e publicação",
            url: "/dashboard/championships/approvals",
            icon: ClipboardCheck,
          },
          {
            id: "championships-registrations",
            title: "Inscrições",
            url: "/dashboard/championships/registrations",
            icon: ClipboardList,
          },
          {
            id: "championships-calendar",
            title: "Calendário e jogos",
            url: "/dashboard/championships/calendar",
            icon: CalendarDays,
          },
          {
            id: "championships-standings",
            title: "Classificações e resultados",
            url: "/dashboard/championships/standings",
            icon: ListOrdered,
          },
          {
            id: "championships-incidents",
            title: "Incidentes",
            url: "/dashboard/championships/incidents",
            icon: Gavel,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        id: "email",
        title: "Email",
        url: "/dashboard/mail",
        icon: Mail,
      },
      {
        id: "chat",
        title: "Chat",
        url: "/dashboard/chat",
        icon: MessageSquare,
      },
      {
        id: "calendar",
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        id: "kanban",
        title: "Kanban",
        url: "/dashboard/kanban",
        icon: Kanban,
      },
      {
        id: "tasks",
        title: "Tasks",
        url: "/dashboard/tasks",
        icon: CheckSquare,
      },
      {
        id: "invoice",
        title: "Invoice",
        url: "/dashboard/invoice",
        icon: ReceiptText,
      },
      {
        id: "profile",
        title: "Profile",
        url: "/dashboard/profile",
        icon: UserRound,
        badge: "new",
      },
      {
        id: "users",
        title: "Utilizadores",
        icon: Users,
        subItems: [
          {
            id: "users-all",
            title: "Todos os utilizadores",
            url: "/dashboard/users",
            icon: ListChecks,
          },
          {
            id: "users-verification",
            title: "Verificação de contas",
            url: "/dashboard/users/verificacao",
            icon: ShieldCheck,
          },
          {
            id: "users-suspended",
            title: "Contas suspensas",
            url: "/dashboard/users/suspensas",
            icon: UserX,
          },
          {
            id: "users-reports",
            title: "Denúncias de utilizadores",
            url: "/dashboard/users/denuncias",
            icon: Flag,
          },
          {
            id: "users-history",
            title: "Histórico de atividade",
            url: "/dashboard/users/historico",
            icon: History,
          },
        ],
      },
      {
        id: "roles",
        title: "Roles",
        url: "/dashboard/roles",
        icon: Lock,
      },
      {
        id: "authentication",
        title: "Authentication",
        icon: Fingerprint,
        subItems: [
          { id: "auth-login-v1", title: "Login v1", url: "/auth/v1/login", newTab: true },
          { id: "auth-login-v2", title: "Login v2", url: "/auth/v2/login", newTab: true },
          { id: "auth-register-v1", title: "Register v1", url: "/auth/v1/register", newTab: true },
          { id: "auth-register-v2", title: "Register v2", url: "/auth/v2/register", newTab: true },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Legacy",
    items: [
      {
        id: "legacy-dashboards",
        title: "Dashboards",
        subItems: [
          { id: "legacy-default", title: "Default V1", url: "/dashboard/default-v1" },
          { id: "legacy-crm", title: "CRM V1", url: "/dashboard/crm-v1" },
          { id: "legacy-finance", title: "Finance V1", url: "/dashboard/finance-v1" },
          { id: "legacy-analytics", title: "Analytics V1", url: "/dashboard/analytics-v1" },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Misc",
    items: [
      {
        id: "others",
        title: "Others",
        url: "/dashboard/coming-soon",
        icon: SquareArrowUpRight,
        badge: "soon",
        disabled: true,
      },
    ],
  },
];
