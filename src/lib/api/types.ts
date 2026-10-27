export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResult extends AuthTokens {
  userId: number;
  sessionId: number;
}

/**
 * Resposta de `POST /auth/login` quando a conta tem OTP (2FA) ativo.
 * Nenhum token é emitido até concluir `POST /auth/login/verify-otp`.
 */
export interface LoginOtpChallenge {
  otpRequired: true;
  challengeId: number;
  channel: string;
  destination: string;
  expiresAt: string;
  /** Código de desenvolvimento — a API devolve-o quando não há envio de email real (local). */
  developmentCode?: string;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  type?: string;
  status?: string;
  /** /users/profile/me returns displayName/firstName instead of name. */
  firstName?: string;
  displayName?: string;
}

export interface City {
  id: number;
  name: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SportModality {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface Team {
  id: number;
  name: string;
  logo?: string | null;
  description?: string | null;
  cityId?: number | null;
  ownerId?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Field {
  id: number;
  name: string;
  address?: string | null;
  cityId?: number | null;
  pricePerHour?: number | null;
  isAvailable?: boolean;
  isActive?: boolean;
  averageRating?: number | null;
  /** Atributos de infraestrutura avaliados na qualidade do campo (0–5). */
  grassQuality?: number | null;
  ballQuality?: number | null;
  netsCondition?: number | null;
  hasRoof?: boolean | null;
  hasShowers?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Resposta agregada da qualidade de um campo (`GET /fields/quality/:fieldId`) —
 * `score` é o valor 0–100 calculado pela média ponderada das avaliações.
 */
export interface FieldQuality {
  id: string;
  fieldId: number;
  score: { value: number };
  updatedAt?: string | null;
}

/** Critérios de qualidade de um campo avaliados por utilizadores (1–5). */
export type FieldQualityCriteria =
  | "RELVADO"
  | "ILUMINACAO"
  | "REDES"
  | "BALNEARIOS"
  | "SEGURANCA"
  | "COBERTURA"
  | "ESTACIONAMENTO"
  | "BOLA_INCLUIDA";

export interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  fieldId?: number | null;
  cityId?: number | null;
  tournamentId?: number | null;
  matchDate?: string | null;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isActive?: boolean;
  homeAcceptedAt?: string | null;
  awayAcceptedAt?: string | null;
  resultValidationStatus?: MatchResultValidationStatus;
}

export type MatchResultValidationStatus = "PENDING" | "VALIDATED" | "DISPUTED";

export type MatchDisputeCategory = "RESULT" | "CONDUCT";
export type MatchDisputeStatus = "OPEN" | "RESOLVED";
export type MatchDisputeDecision = "MAINTAIN" | "CORRECT" | "UPHOLD" | "DISMISS";

export interface MatchDispute {
  id: number;
  matchId: number;
  reportingTeamId: number;
  reporterUserId: number;
  category: MatchDisputeCategory;
  reason: string;
  evidenceUrl: string | null;
  status: MatchDisputeStatus;
  originalHomeScore: number;
  originalAwayScore: number;
  decision: MatchDisputeDecision | null;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  resolutionNote: string | null;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchDisputeInput {
  teamId: number;
  category: MatchDisputeCategory;
  reason: string;
  evidenceUrl?: string;
}

export type MatchDisputeResolutionInput =
  | { decision: "MAINTAIN"; resolutionNote: string }
  | { decision: "CORRECT"; homeScore: number; awayScore: number; resolutionNote: string }
  | { decision: "UPHOLD" | "DISMISS"; resolutionNote: string };

export interface MatchmakingSearchAttempt {
  id: number;
  teamId: number;
  cityId: number;
  status: "PROCESSING" | "MATCHED" | "NO_MATCH" | "FAILED";
  candidateCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export type MatchmakingQueueJobStatus = "waiting" | "active" | "delayed" | "failed" | "completed" | "paused";

export interface MatchmakingQueueJob {
  id: string;
  teamId: number;
  status: MatchmakingQueueJobStatus;
  enqueuedAt: string;
  processedAt: string | null;
  finishedAt: string | null;
  failureReason: string | null;
}

export interface MatchmakingQueueSnapshot {
  available: boolean;
  error: string | null;
  counts: Record<MatchmakingQueueJobStatus, number>;
  jobs: MatchmakingQueueJob[];
}

export interface MatchmakingOperations {
  counts: {
    processing: number;
    matched: number;
    unmatched: number;
    failed: number;
    pendingInvitations: number;
  };
  queue: MatchmakingQueueSnapshot;
  attempts: MatchmakingSearchAttempt[];
  invitations: MatchmakingMatch[];
}

export interface Booking {
  id: number;
  fieldId: number;
  userId?: number | null;
  cityId?: number | null;
  startTime?: string;
  endTime?: string;
  totalPrice?: number | null;
  status: string;
  isActive?: boolean;
  /** A API devolve os campos de auditoria; usados para ordenar a atividade recente. */
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  status?: string;
  type?: string;
}

export interface Player {
  id: string;
  fullName: string;
  nickname?: string | null;
  position?: string | null;
  jerseyNumber?: number | null;
  teamId?: number | null;
  cityId?: number | null;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  isActive?: boolean;
  birthDate?: string | null;
  avatar?: string | null;
  isCaptain?: boolean;
  yellowCards?: number;
  redCards?: number;
  cleanSheets?: number;
  mvpAwards?: number;
  minutesPlayed?: number;
  rating?: PlayerRating;
}

/** Atributos de desempenho do jogador (GET /players devolve `rating` ao lado de `core`). */
export interface PlayerRating {
  attack: number;
  defense: number;
  passing: number;
  speed: number;
  stamina: number;
}

export interface TournamentRules {
  minTeams: number;
  maxTeams: number;
  allowDraws: boolean;
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
}

export interface Tournament {
  id: number;
  name: string;
  description: string | null;
  type: string;
  modalityId?: number | null;
  cityId?: number | null;
  organizerId?: number | null;
  suspendedFromStatus?: TournamentResumableStatus | null;
  period: { startDate: string; endDate: string };
  rules: TournamentRules;
  /** DRAFT | REGISTRATION_OPEN | REGISTRATION_CLOSED | IN_PROGRESS | FINISHED | CANCELLED */
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TournamentRegistration {
  id: number;
  tournamentId: number;
  teamId: number;
  /** PENDING | APPROVED | REJECTED | REMOVED */
  status: string;
  registeredAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

export interface TournamentStanding {
  id: number;
  tournamentId: number;
  teamId: number;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference?: number;
  points: number;
}

/** Estados alvo aceites por PATCH /tournaments/:id/status (DRAFT não tem transição de volta). */
export type TournamentStatusTransition =
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "SUSPENDED"
  | "FINISHED"
  | "CANCELLED";

export type TournamentResumableStatus = "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "IN_PROGRESS";

/** Payload de criação/edição de cidade (POST|PUT /cities). */
export interface CityInput {
  name: string;
  state: string;
  country: string;
}

/** Payload de criação de campo (POST /fields). */
export interface FieldInput {
  name: string;
  address: string;
  cityId: number;
  pricePerHour: number;
}

/** Payload de edição de campo (PUT /fields/:id) — todos os campos são opcionais. */
export interface FieldUpdateInput {
  name?: string;
  address?: string;
  pricePerHour?: number;
  isAvailable?: boolean;
}

/** Payload de criação de equipa (POST /teams). */
export interface TeamInput {
  name: string;
  logo?: string;
  description?: string;
  cityId: number;
  ownerId: number;
}

/** Payload de edição de equipa (PUT /teams/:id). */
export interface TeamUpdateInput {
  name?: string;
  logo?: string;
  description?: string;
}

/** Payload de criação de jogador (POST /players). */
export interface PlayerCreateInput {
  fullName: string;
  nickname?: string;
  birthDate: string;
  position: string;
  jerseyNumber: number;
  teamId: number;
  cityId: number;
}

/** Payload de edição de jogador (PUT /players/:id) — posição e data de nascimento não são editáveis. */
export interface PlayerUpdateInput {
  fullName?: string;
  nickname?: string;
  jerseyNumber?: number;
}

/** Payload de criação de campeonato (POST /tournaments). */
export interface TournamentCreateInput {
  name: string;
  description?: string;
  type: string;
  modalityId?: number | null;
  cityId?: number | null;
  organizerId?: number;
  startDate: string;
  endDate: string;
  rules: TournamentRules;
}

/** Payload de edição de campeonato (PUT /tournaments/:id) — nome e descrição apenas. */
export interface TournamentUpdateInput {
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  system?: boolean;
  active?: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  type?: string;
  status?: string;
  profileId?: number | null;
  roles?: Role[];
  emailVerifiedAt?: string | null;
  termsAcceptedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  id: number;
  userId: number;
  type?: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  address?: string | null;
  website?: string | null;
  cityId?: number | null;
  dateOfBirth?: string | null;
}

export interface SessionInfo {
  sessionId: number;
  userId: number;
  authAccountId: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export interface RegisterResult {
  accountId: number;
  userId: number;
  email: string;
  status: string;
  role: string;
}

export type AccountType = "player" | "team_owner" | "field_owner" | "admin" | "platform_manager";

export interface MetricDelta {
  current: number;
  previous: number;
  deltaPct: number | null;
}

export interface MetricsOverview {
  revenue: MetricDelta;
  newUsers: MetricDelta;
  teams: { total: number; active: number };
  bookings: MetricDelta & { total: number; pending: number };
  players: { total: number };
  users: { total: number; active: number };
  fields: { total: number; available: number };
}

export interface TimeseriesPoint {
  period: string;
  bookings: number;
  matches: number;
  players: number;
}

export interface MetricsTimeseries {
  bucket: "day" | "week";
  days: number;
  cityId: number | null;
  points: TimeseriesPoint[];
}

export interface RecentUser {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  primaryRole: string | null;
  createdAt: string;
}

export interface AudienceOverview {
  range: { days: number };
  users: MetricDelta & { total: number; active: number };
  players: MetricDelta & { total: number };
  bookings: MetricDelta & { total: number };
  conversion: {
    bookers: number;
    rate: number;
    previousBookers: number;
    previousRate: number;
    deltaPct: number | null;
  };
  teams: { total: number };
}

export interface TopTeam {
  id: number;
  name: string;
  city: string;
  matches: number;
}

export interface TeamsTop {
  range: { days: number };
  periodMatches: number;
  teams: TopTeam[];
}

export interface CityAssets {
  cityId: number;
  city: string;
  fields: number;
  teams: number;
  players: number;
  total: number;
}

export interface AnalyticsAssets {
  totals: { fields: number; teams: number; players: number };
  byCity: CityAssets[];
  byProfile: Array<{ type: string; count: number }>;
}

export interface FeatureMetric {
  key: string;
  current: number;
  previous: number;
  deltaPct: number | null;
  total: number;
}

export interface AnalyticsFeatures {
  days: number;
  features: FeatureMetric[];
}

export interface GrowthPoint {
  period: string;
  newUsers: number;
  activeUsers: number;
}

export interface AudienceGrowth {
  days: number;
  bucket: "day" | "week";
  points: GrowthPoint[];
  totals: {
    newUsers: number;
    activeUsers: number;
  };
}

export interface AcquisitionFunnel {
  days: number;
  steps: Array<{ key: string; count: number }>;
  rates: {
    profilePct: number;
    rolePct: number;
    bookingPct: number;
  };
  bySegment: Array<{ type: string; count: number }>;
}

export interface OperationState {
  status: string;
  count: number;
}

export interface EngagementStates {
  days: number;
  bookings: OperationState[];
  matches: OperationState[];
  matchmaking: OperationState[];
}

export interface RevenuePoint {
  period: string;
  volume: number;
}

export interface ConversionsOverview {
  days: number;
  bookings: {
    created: number;
    completed: number;
    previousCompleted: number;
    deltaCompleted: number | null;
    cancelled: number;
  };
  payments: {
    created: number;
    paid: number;
    previousPaid: number;
    deltaPaid: number | null;
    byStatus: OperationState[];
  };
  volume: {
    current: number;
    previous: number;
    deltaPct: number | null;
  };
  paymentRate: {
    current: number;
    previous: number;
    deltaPct: number | null;
  };
  funnel: Array<{ key: string; count: number }>;
  revenuePoints: RevenuePoint[];
}

// ============================================================
// PRODUCTIVITY — departamentos, membros e tarefas
// ============================================================

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface MemberInfo {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string;
}

export interface DepartmentItem {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: MemberInfo[];
  memberCount: number;
  taskCount: number;
  doneTaskCount: number;
}

export interface TaskItem {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  departmentId: number;
  departmentName: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  departmentId: number;
  assigneeId?: number | null;
}

/** Resultado comum das server actions de CRUD (sucesso ou erro legível). */
export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

// ============================================================
// STORE — catálogo, stock e métricas da loja
// ============================================================

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type StockMovementType = "IN" | "OUT" | "ADJUST" | "RETURN" | "LOSS";

/** Categoria ou marca do catálogo (ambas têm a mesma visão). */
export interface StoreCatalogItem {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreVariant {
  id: number;
  productId: number;
  size: string | null;
  color: string | null;
  sku: string;
  price: number | null;
  isActive: boolean;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
}

export interface StoreProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: ProductStatus;
  categoryId: number | null;
  categoryName: string | null;
  brandId: number | null;
  brandName: string | null;
  variants: StoreVariant[];
  variantCount: number;
  stockUnits: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreProductImage {
  id: number;
  url: string;
  altText: string | null;
  position: number;
  variantId: number | null;
}

export interface InventoryRow {
  variantId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  size: string | null;
  color: string | null;
  sku: string;
  price: number;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  lowStock: boolean;
  outOfStock: boolean;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  variantId: number;
  sku: string;
  productName: string;
  size: string | null;
  color: string | null;
  type: StockMovementType;
  quantity: number;
  resultQuantity: number;
  reason: string | null;
  createdAt: string;
}

/** Ponto da série diária de `GET /store/analytics/overview`. */
export interface StoreOverviewPeriodPoint {
  /** Data (YYYY-MM-DD, UTC). */
  date: string;
  revenue: number;
  orders: number;
  units: number;
  cancelled: number;
}

export interface StoreOverviewTopProduct {
  name: string;
  category: string | null;
  quantity: number;
  revenue: number;
  /** % da receita total (0-100). */
  share: number;
}

export interface StoreOverviewCategory {
  name: string;
  revenue: number;
  share: number;
}

export interface StoreOverviewCustomer {
  userId: number;
  orders: number;
  revenue: number;
}

/** Resposta de `GET /store/analytics/overview` (agregada no servidor). */
export interface StoreOverview {
  revenue: {
    total: number;
    byPeriod: StoreOverviewPeriodPoint[];
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    completed: number;
    cancelled: number;
    averageValue: number;
  };
  customers: {
    total: number;
  };
  topProducts: StoreOverviewTopProduct[];
  topCustomers: StoreOverviewCustomer[];
  salesByCategory: StoreOverviewCategory[];
  inventory: {
    variants: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface StoreMetrics {
  products: {
    total: number;
    active: number;
    draft: number;
    archived: number;
    categories: number;
    brands: number;
    variants: number;
  };
  stock: {
    units: number;
    reserved: number;
    available: number;
    lowStockItems: number;
    outOfStockItems: number;
    value: number;
  };
}

export interface CatalogInput {
  name: string;
  description?: string | null;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  status?: ProductStatus;
  categoryId?: number | null;
  brandId?: number | null;
}

export interface VariantInput {
  size?: string | null;
  color?: string | null;
  sku: string;
  price?: number | null;
  isActive?: boolean;
}

export interface StockAdjustInput {
  type?: StockMovementType;
  quantity?: number;
  reason?: string | null;
  minStock?: number;
}

// ============================================================
// STORE — ENCOMENDAS, REMESSAS E RESERVAS
// ============================================================

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export type ShipmentStatus = "PREPARING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export type ReservationStatus = "ACTIVE" | "RELEASED" | "COMMITTED";

export interface StoreOrderRow {
  id: number;
  orderNumber: string;
  userId: number;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreOrderItem {
  id: number;
  orderId: number;
  variantId: number | null;
  skuSnapshot: string;
  productNameSnapshot: string;
  variantSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface StoreOrderAddress {
  id: number;
  orderId: number;
  type: string;
  recipientName: string;
  phone: string;
  cityId: number | null;
  addressLine: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface StoreOrderPayment {
  id: number;
  orderId: number;
  paymentId: number | null;
  status: string;
  amount: number;
  createdAt: string;
}

export interface StoreShipment {
  id: number;
  orderId: number;
  status: ShipmentStatus;
  shippingMethod: string;
  trackingCode: string | null;
  carrier: string | null;
  shippingCost: number;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface StoreOrderReservation {
  id: number;
  variantId: number;
  orderId: number;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
}

export interface StoreOrderDetail {
  order: StoreOrderRow;
  items: StoreOrderItem[];
  address: StoreOrderAddress | null;
  payments: StoreOrderPayment[];
  shipment: StoreShipment | null;
  reservations: StoreOrderReservation[];
}

export interface StoreOrderList {
  items: StoreOrderRow[];
  total: number;
  limit: number;
  offset: number;
}

export type StoreReturnReason = "DEFECTIVE" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "CHANGE_OF_MIND" | "OTHER";

export type StoreReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "INSPECTED"
  | "REFUND_RECORDED"
  | "CLOSED";

export interface StoreReturnPolicy {
  enabled: boolean;
  windowDays: number;
  allowChangeOfMind: boolean;
  updatedAt: string;
}

export interface StoreReturnItem {
  id: number;
  returnRequestId: number;
  orderItemId: number;
  quantityRequested: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRestocked: number;
  inspectionNote: string | null;
  productName: string;
  sku: string;
  variant: string | null;
  variantId: number | null;
  unitPrice: number;
}

export interface StoreReturnEvent {
  id: number;
  returnRequestId: number | null;
  actorId: number | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
}

export interface StoreReturnRequest {
  id: number;
  orderId: number;
  orderNumber: string;
  customerId: number;
  reason: StoreReturnReason;
  description: string;
  status: StoreReturnStatus;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  carrier: string | null;
  trackingCode: string | null;
  receivedBy: number | null;
  receivedAt: string | null;
  inspectedBy: number | null;
  inspectedAt: string | null;
  refundAmount: number;
  refundMethod: string | null;
  refundReference: string | null;
  refundNote: string | null;
  refundedBy: number | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: StoreReturnItem[];
  events: StoreReturnEvent[];
}

// ============================================================
// MATCHES / MATCHMAKING — partidas, emparelhamento e logística
// ============================================================

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  LIVE = "LIVE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
  POSTPONED = "POSTPONED",
}

/** Partida já resolvida com nomes de equipas/campo/cidade (view da lista de logística). */
export interface MatchSimple {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  fieldId: number | null;
  cityId: number | null;
  tournamentId: number | null;
  status: MatchStatus;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  homeAcceptedAt?: string | null;
  awayAcceptedAt?: string | null;
  resultValidationStatus?: MatchResultValidationStatus;
  homeTeamName: string;
  awayTeamName: string;
  fieldName: string | null;
  cityName: string | null;
}

/** Detalhe completo de uma partida, resolvido no servidor (equipas, campo e convocados). */
export interface MatchDetail {
  match: MatchSimple;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  field: FieldSummary | null;
  players: PlayerSummary[];
  city: CityInfo | null;
}

/** Cidade da partida com as equipas e campos da mesma cidade (aba Cidade). */
export interface CityInfo {
  id: number;
  name: string;
  teams: Team[];
  fields: FieldSummary[];
}

/** Corpo aceite por POST /matches (zod `CreateMatchDto`). */
export interface MatchFormValues {
  homeTeamId: number;
  awayTeamId: number;
  fieldId: number;
  cityId: number;
  tournamentId?: number;
  matchDate: Date;
}

/** Resumo de equipa usado nos detalhes da partida. */
export interface TeamSummary {
  id: number;
  name: string;
  cityName?: string | null;
  logo?: string | null;
  isActive?: boolean;
}

/** Resumo de jogador usado na lista de convocados da partida. */
export interface PlayerSummary {
  id: string;
  fullName: string;
  position?: string | null;
  jerseyNumber?: number | null;
  teamId?: number | null;
  teamName?: string;
}

/** Resumo de campo usado nos detalhes da partida (GET /fields emite `address`). */
export interface FieldSummary {
  id: number;
  name: string;
  address?: string | null;
  cityName?: string | null;
  pricePerHour?: number | null;
  isAvailable?: boolean;
}

export enum MatchmakingStrategy {
  COMPETITIVE = "COMPETITIVE",
  FRIENDLY = "FRIENDLY",
  NEAREST = "NEAREST",
  TOURNAMENT = "TOURNAMENT",
  BALANCED = "BALANCED",
}

export enum MatchmakingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface MatchmakingRequest {
  id: string;
  teamId: number;
  cityId: number;
  strategy: MatchmakingStrategy;
  status: MatchmakingStatus;
  createdAt: string;
}

/** Recomendação (entidade de domínio) devolvida por POST /matchmaking/find. */
export interface MatchmakingRecommendation {
  id: number;
  requestId: number;
  requesterTeamId: number;
  candidateTeamId: number;
  score: number;
  rankPosition: number;
  cityId: number;
  createdAt?: string;
}

/** Recomendação persistida devolvida por GET /matchmaking/recommendations?teamId=. */
export interface MatchmakingRecommendationRow {
  id: number;
  teamId: number;
  candidateTeamId: number;
  score: number;
  strategy: string;
  cityId: number;
  isAccepted: boolean;
  createdAt?: string;
}

/** Resultado de POST /matchmaking/:id/accept|reject. */
export interface MatchmakingMatch {
  id: number;
  requesterTeamId: number;
  candidateTeamId: number;
  status: MatchmakingStatus;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

/** Nome do evento Socket.IO emitido no room `city:<cityId>`. */
export type RealtimeMatchEventName = "match:created" | "match:started" | "match:score_updated" | "match:finished";

/** Tipo interno do payload enviado pelo `NotificationService` do peladeiro-api. */
export type RealtimeMatchEventType = "MATCH_CREATED" | "MATCH_STARTED" | "SCORE_UPDATED" | "MATCH_FINISHED";

export interface RealtimeMatchEventData {
  id?: number;
  cityId?: number;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamId?: number;
  awayTeamId?: number;
}

/** Evento emitido pelo Socket.IO em `city:<cityId>` (match:created|started|score_updated|finished). */
export interface RealtimeMatchEvent {
  /** Nome do evento ao qual a subscription está ligada. */
  event: RealtimeMatchEventName;
  type: RealtimeMatchEventType;
  message: string;
  data?: RealtimeMatchEventData;
  timestamp: string;
}

// ============================================================
// CAMPEONATOS — fases, jogos, prémios, disciplinas, pagamentos,
// históricos e estatísticas (sub-menus de gestão)
// ============================================================

/** Regras de uma fase (torneio por grupos ou eliminatória). */
export interface StageRule {
  matchesPerTeam: number;
  qualifiedTeams: number;
  elimination: boolean;
  homeAndAway: boolean;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  allowDraw: boolean;
}

/**
 * Fase de um campeonato. `GET` devolve chaves limpas (`stageId`); o `PUT`
 * devolve a entidade de domínio com prefixes `_` — o fetcher normaliza.
 */
export interface TournamentStage {
  stageId: number;
  tournamentId: number;
  name: string;
  /** GROUP | LEAGUE | ROUND_ROBIN | KNOCKOUT | QUARTER_FINAL | SEMI_FINAL | FINAL | THIRD_PLACE | SWISS */
  type: string;
  order: number;
  /** PENDING | ACTIVE | COMPLETED | CANCELLED */
  status: string;
  rule?: StageRule;
  startedAt?: string | null;
  completedAt?: string | null;
}

/** Payload de criação de fase (POST /tournament-stages). */
export interface StageCreateInput {
  tournamentId: number;
  name: string;
  type: string;
  order: number;
  rule: StageRule;
}

/** Payload de edição de fase (PUT /tournament-stages/:stageId). */
export interface StageUpdateInput {
  name?: string;
  rule?: StageRule;
}

/** Jogo (fixture) gerado de um campeonato. */
export interface TournamentFixture {
  id: number;
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  /** LEAGUE | KNOCKOUT | GROUP_STAGE | ROUND_ROBIN | FRIENDLY */
  type: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  fieldId?: number | null;
  isPlayed: boolean;
  isPublished?: boolean;
  isCancelled?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  createdAt?: string;
}

/** Payload de resultado de jogo (PUT /tournament-fixtures/:id) — os dois golos são obrigatórios. */
export interface FixtureResultInput {
  homeScore: number;
  awayScore: number;
}

export interface FixtureUpdateInput {
  homeScore?: number;
  awayScore?: number;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  fieldId?: number | null;
  isCancelled?: boolean;
  isPublished?: boolean;
  resultReason?: string;
}

export interface TournamentFixtureResultHistory {
  id: number;
  fixtureId: number;
  tournamentId: number;
  actorUserId: number;
  previousHomeScore: number | null;
  previousAwayScore: number | null;
  homeScore: number;
  awayScore: number;
  reason: string;
  createdAt: string;
}

export type TournamentIncidentType = "WITHDRAWAL" | "CONFLICT" | "CONTESTATION" | "OTHER";
export type TournamentIncidentStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export interface TournamentIncident {
  id: number;
  tournamentId: number;
  fixtureId: number | null;
  type: TournamentIncidentType;
  status: TournamentIncidentStatus;
  title: string;
  description: string;
  resolutionNote: string | null;
  reportedBy: number;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentIncidentCreateInput {
  tournamentId: number;
  fixtureId?: number | null;
  type: TournamentIncidentType;
  title: string;
  description: string;
}

/** Payload de geração de jogos (POST /tournament-fixtures/generate|regenerate). */
export interface GenerateFixturesInput {
  tournamentId: number;
  teamIds: number[];
}

/** Prémio de um campeonato. */
export interface TournamentAward {
  id: number;
  tournamentId: number;
  /** CHAMPION | RUNNER_UP | THIRD_PLACE | MVP | TOP_SCORER | TOP_ASSIST | BEST_GOALKEEPER | BEST_DEFENDER | BEST_ATTACKER | FAIR_PLAY | BEST_PLAYER | BEST_TEAM */
  type: string;
  playerId?: string | number | null;
  teamId?: number | null;
  position?: number | null;
  score?: number | null;
  description?: string | null;
  assignedAt?: string | null;
}

/** Payload de edição de prémio (PUT /tournament-awards/awards/:awardId). */
export interface AwardUpdateInput {
  playerId?: string | number | null;
  teamId?: number | null;
  position?: number | null;
  score?: number | null;
  description?: string | null;
}

/** Registo disciplinar (cartão, suspensão ou penalização). */
export interface TournamentDiscipline {
  id: number;
  tournamentId: number;
  matchId?: number | null;
  playerId?: string | null;
  teamId?: number | null;
  disciplineId?: number | null;
  /** CARD | SUSPENSION | PENALTY */
  type: string;
  cardType?: "YELLOW" | "RED" | null;
  minute?: number | null;
  reason?: string | null;
  suspensionMatches?: number | null;
  remainingMatches?: number | null;
  penaltyAmount?: number | null;
  active: boolean;
  liftedAt?: string | null;
  liftReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload de registo de cartão (POST /tournament-discipline/cards). */
export interface RegisterCardInput {
  tournamentId: number;
  matchId?: number;
  playerId?: string;
  teamId: number;
  cardType: "YELLOW" | "RED";
  minute?: number;
  reason?: string;
}

/** Payload de suspensão de jogador (POST /tournament-discipline/suspensions). */
export interface SuspendPlayerInput {
  tournamentId: number;
  playerId: string;
  matches: number;
  reason: string;
  disciplineId?: number;
}

/** Payload de levantamento de suspensão (PATCH /tournament-discipline/suspensions/lift). */
export interface LiftSuspensionInput {
  disciplineId: number;
  tournamentId: number;
  playerId: string;
  reason?: string;
}

/** Payload de penalização financeira (POST /tournament-discipline/penalties). */
export interface ApplyPenaltyInput {
  tournamentId: number;
  playerId?: string;
  teamId?: number;
  disciplineId?: number;
  reason: string;
  amount?: number;
}

/** Pagamento de inscrição de um campeonato. */
export interface TournamentPayment {
  id: number;
  tournamentId?: number;
  teamId: number;
  registrationId?: number | null;
  paymentId?: number | null;
  /** REGISTRATION | ENTRY_FEE | TOURNAMENT_FEE | PENALTY | REFUND */
  type?: string | null;
  amount?: number | null;
  currency?: string;
  /** PENDING | PROCESSING | PAID | FAILED | CANCELLED | REFUNDED */
  status: string;
  paidAt?: string | null;
  refundedAt?: string | null;
  reference?: string | null;
}

/** Payload de criação de pagamento (POST /tournament-payments/). */
export interface CreatePaymentInput {
  tournamentId: number;
  teamId: number;
  registrationId?: number;
}

/** Entrada do histórico de um campeonato (snapshot de classificação/prémios). */
export interface TournamentHistoryEntry {
  teamId: number | null;
  teamName: string | null;
  playerId?: string | null;
  playerName?: string | null;
  position?: number | null;
  type: string;
  awardType?: string | null;
  value?: number | null;
  description?: string | null;
}

/** Histórico de um campeonato (normalizado pelo fetcher a partir da entidade `_`). */
export interface TournamentHistory {
  id: number;
  tournamentId: number;
  tournamentName: string | null;
  tournamentType: string | null;
  championTeamId: number | null;
  championTeamName: string | null;
  runnerUpTeamId: number | null;
  runnerUpTeamName: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  entries: TournamentHistoryEntry[];
  createdAt?: string;
}

/** Melhor marcador do campeonato (GET /tournament-statistics/:id/top-scorers). */
export interface TournamentTopScorer {
  playerId: number;
  playerName: string;
  goals: number;
}

/** Melhor assistente do campeonato (GET /tournament-statistics/:id/top-assists). */
export interface TournamentTopAssist {
  playerId: number;
  playerName: string;
  assists: number;
}

/** Estatísticas de uma equipa num campeonato (null quando a equipa não tem jogos). */
export interface TournamentTeamStats {
  teamId: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Estatísticas de um jogador num campeonato (null quando não tem jogos). */
export interface TournamentPlayerStats {
  playerId: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  mvpAwards: number;
  minutesPlayed: number;
}
