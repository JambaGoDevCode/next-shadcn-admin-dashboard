import {
  Activity,
  Award,
  Banknote,
  Calendar,
  CalendarClock,
  CalendarDays,
  ChartBar,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Eye,
  Fingerprint,
  Flag,
  FolderOpen,
  Forklift,
  Gauge,
  Gavel,
  Goal,
  GraduationCap,
  HeartPulse,
  History,
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
  PersonStanding,
  ReceiptText,
  Server,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SquareArrowUpRight,
  Store,
  TrendingUp,
  TriangleAlert,
  Trophy,
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
        title: "Finance",
        url: "/dashboard/finance",
        icon: Banknote,
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
        title: "Store",
        url: "/dashboard/store",
        icon: Store,
        badge: "new",
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
        id: "logistics",
        title: "Partidas",
        url: "/dashboard/logistics",
        icon: Forklift,
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
        title: "Campeonatos",
        icon: Trophy,
        subItems: [
          { id: "championships-main", title: "Campeonatos", url: "/dashboard/championships", icon: Trophy },
          {
            id: "championships-registrations",
            title: "Inscrições",
            url: "/dashboard/championships/registrations",
            icon: ClipboardList,
          },
          {
            id: "championships-standings",
            title: "Classificações",
            url: "/dashboard/championships/standings",
            icon: ListOrdered,
          },
          { id: "championships-stages", title: "Fases", url: "/dashboard/championships/stages", icon: Layers },
          {
            id: "championships-fixtures",
            title: "Jogos",
            url: "/dashboard/championships/fixtures",
            icon: CalendarDays,
          },
          { id: "championships-awards", title: "Prémios", url: "/dashboard/championships/awards", icon: Award },
          {
            id: "championships-disciplines",
            title: "Disciplinas",
            url: "/dashboard/championships/disciplines",
            icon: Gavel,
          },
          {
            id: "championships-payments",
            title: "Pagamentos",
            url: "/dashboard/championships/payments",
            icon: Banknote,
          },
          {
            id: "championships-histories",
            title: "Históricos",
            url: "/dashboard/championships/histories",
            icon: History,
          },
          {
            id: "championships-statistics",
            title: "Estatísticas",
            url: "/dashboard/championships/statistics",
            icon: ChartBar,
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
