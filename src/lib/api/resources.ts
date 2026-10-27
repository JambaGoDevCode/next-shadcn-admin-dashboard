import { apiFetch, extractData } from "./client";
import { type ApiCityRow, normalizeCity } from "./management";
import type {
  AcquisitionFunnel,
  AnalyticsAssets,
  AnalyticsFeatures,
  AudienceGrowth,
  AudienceOverview,
  Booking,
  CatalogInput,
  City,
  ConversionsOverview,
  DepartmentInput,
  DepartmentItem,
  EngagementStates,
  Field,
  InventoryRow,
  Match,
  MatchDispute,
  MatchDisputeInput,
  MatchDisputeResolutionInput,
  MatchFormValues,
  MatchmakingMatch,
  MatchmakingOperations,
  MatchmakingRecommendation,
  MatchmakingRecommendationRow,
  MemberInfo,
  MetricsOverview,
  MetricsTimeseries,
  Player,
  ProductInput,
  RecentUser,
  SportModality,
  StockAdjustInput,
  StockMovement,
  StoreCatalogItem,
  StoreMetrics,
  StoreOrderDetail,
  StoreOrderList,
  StoreOrderRow,
  StoreOverview,
  StoreProduct,
  StoreProductImage,
  StoreReturnPolicy,
  StoreReturnReason,
  StoreReturnRequest,
  StoreShipment,
  StoreVariant,
  TaskInput,
  TaskItem,
  Team,
  TeamsTop,
  UserSummary,
  VariantInput,
} from "./types";

async function list<T>(path: string, token: string): Promise<T[]> {
  const payload = await apiFetch<unknown>(path, { token });
  const data = extractData<T[] | T>(payload);
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
}

export function getUsers(token: string): Promise<UserSummary[]> {
  return list<UserSummary>("/users", token);
}

export function getSportModalities(token: string): Promise<SportModality[]> {
  return list<SportModality>("/sport/modalities", token);
}

/** The API has no list-all users endpoint — lookup is only possible by exact email. */
export function findUserByEmail(token: string, email: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`/users?email=${encodeURIComponent(email)}`, { token }).then(extractData<UserSummary>);
}

export function getTeams(token: string): Promise<Team[]> {
  return list<Team>("/teams", token);
}

export function getFields(token: string): Promise<Field[]> {
  return list<Field>("/fields", token);
}

export async function getCities(token: string): Promise<City[]> {
  const rows = await list<ApiCityRow>("/cities", token);
  return rows.map(normalizeCity);
}

export function getLiveMatches(token: string): Promise<Match[]> {
  return list<Match>("/matches/live", token);
}

export function getUpcomingMatches(token: string): Promise<Match[]> {
  return list<Match>("/matches/upcoming", token);
}

export function getMatches(token: string): Promise<Match[]> {
  return list<Match>("/matches", token);
}

export function getMatch(token: string, id: number): Promise<Match> {
  return apiFetch<Match>(`/matches/${id}`, { token }).then(extractData<Match>);
}

export function createMatch(token: string, input: MatchFormValues): Promise<Match> {
  return apiFetch<Match>("/matches", { method: "POST", body: input, token }).then(extractData<Match>);
}

/** POST /matches/schedule — gera partidas em round-robin para a lista de equipas indicada. */
export function scheduleMatches(
  token: string,
  input: { teamIds: number[]; fieldId: number; cityId: number },
): Promise<Match[]> {
  return apiFetch<Match[]>("/matches/schedule", { method: "POST", body: input, token })
    .then(extractData<Match[] | Match>)
    .then((data) => {
      if (Array.isArray(data)) return data;
      return data ? [data] : [];
    });
}

/** PATCH /matches/:id/start — coloca a partida em curso (LIVE). */
export function startMatch(token: string, id: number): Promise<Match> {
  return apiFetch<Match>(`/matches/${id}/start`, { method: "PATCH", token }).then(extractData<Match>);
}

/** PATCH /matches/:id/finish — finaliza a partida. */
export function finishMatch(token: string, id: number): Promise<Match> {
  return apiFetch<Match>(`/matches/${id}/finish`, { method: "PATCH", token }).then(extractData<Match>);
}

/** PATCH /matches/:id/cancel — cancela a partida. */
export function cancelMatch(token: string, id: number): Promise<Match> {
  return apiFetch<Match>(`/matches/${id}/cancel`, { method: "PATCH", token }).then(extractData<Match>);
}

/** PATCH /matches/:id/reschedule — reagenda a partida (fica com estado POSTPONED). */
export function rescheduleMatch(token: string, id: number, matchDate: Date): Promise<Match> {
  return apiFetch<Match>(`/matches/${id}/reschedule`, {
    method: "PATCH",
    body: { matchDate: matchDate.toISOString() },
    token,
  }).then(extractData<Match>);
}

/** PATCH /matches/:id/score — atualiza o placar da partida. */
export function updateMatchScore(token: string, id: number, homeScore: number, awayScore: number): Promise<Match> {
  return apiFetch<Match>(`/matches/${id}/score`, {
    method: "PATCH",
    body: { homeScore, awayScore },
    token,
  }).then(extractData<Match>);
}

export function deleteMatch(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/matches/${id}`, { method: "DELETE", token });
}

// Match by team
export function getMatchesByTeam(token: string, teamId: number): Promise<Match[]> {
  return list<Match>(`/matches/team/${teamId}`, token);
}

// Match by field
export function getMatchesByField(token: string, fieldId: number): Promise<Match[]> {
  return list<Match>(`/matches/field/${fieldId}`, token);
}

// Match by city
export function getMatchesByCity(token: string, cityId: number): Promise<Match[]> {
  return list<Match>(`/matches/city/${cityId}`, token);
}

// Match by tournament
export function getMatchesByTournament(token: string, tournamentId: number): Promise<Match[]> {
  return list<Match>(`/matches/tournament/${tournamentId}`, token);
}

// Matchmaking
/** POST /matchmaking/find — procura adversários e devolve as recomendações geradas. */
export function findMatch(token: string, teamId: number): Promise<MatchmakingRecommendation[]> {
  return apiFetch<MatchmakingRecommendation[]>("/matchmaking/find", { method: "POST", body: { teamId }, token }).then(
    extractData<MatchmakingRecommendation[]>,
  );
}

/** GET /matchmaking/recommendations — recomendações já persistidas para uma equipa. */
export function getMatchmakingRecommendations(token: string, teamId: number): Promise<MatchmakingRecommendationRow[]> {
  return list<MatchmakingRecommendationRow>(`/matchmaking/recommendations?teamId=${teamId}`, token);
}

/** POST /matchmaking/:id/accept — aceita o convite e devolve o jogo de matchmaking. */
export function acceptMatchmaking(token: string, id: number): Promise<MatchmakingMatch> {
  return apiFetch<MatchmakingMatch>(`/matchmaking/${id}/accept`, { method: "POST", token }).then(
    extractData<MatchmakingMatch>,
  );
}

/** POST /matchmaking/:id/reject — rejeita o convite e devolve o jogo de matchmaking. */
export function rejectMatchmaking(token: string, id: number): Promise<MatchmakingMatch> {
  return apiFetch<MatchmakingMatch>(`/matchmaking/${id}/reject`, { method: "POST", token }).then(
    extractData<MatchmakingMatch>,
  );
}

export function getMatchmakingOperations(token: string): Promise<MatchmakingOperations> {
  return apiFetch<MatchmakingOperations>("/matchmaking/operations", { token }).then(extractData<MatchmakingOperations>);
}

export function getMatchDisputes(token: string): Promise<MatchDispute[]> {
  return list<MatchDispute>("/matches/operations/disputes", token);
}

export function createMatchDispute(token: string, matchId: number, input: MatchDisputeInput): Promise<MatchDispute> {
  return apiFetch<MatchDispute>(`/matches/${matchId}/disputes`, {
    method: "POST",
    body: input,
    token,
  }).then(extractData<MatchDispute>);
}

export function resolveMatchDispute(
  token: string,
  disputeId: number,
  input: MatchDisputeResolutionInput,
): Promise<MatchDispute> {
  return apiFetch<MatchDispute>(`/matches/operations/disputes/${disputeId}`, {
    method: "PATCH",
    body: input,
    token,
  }).then(extractData<MatchDispute>);
}

export function validateMatchResult(token: string, matchId: number): Promise<Match> {
  return apiFetch<Match>(`/matches/operations/${matchId}/validate-result`, {
    method: "PATCH",
    token,
  }).then(extractData<Match>);
}

export function getBookings(token: string): Promise<Booking[]> {
  return list<Booking>("/bookings", token);
}

export function getPlayers(token: string): Promise<Player[]> {
  return list<Player>("/players", token);
}

export function getMetricsOverview(token: string): Promise<MetricsOverview> {
  return apiFetch<MetricsOverview>("/metrics/overview", { token }).then(extractData<MetricsOverview>);
}

export function getMetricsTimeseries(token: string, days = 90, cityId?: number): Promise<MetricsTimeseries> {
  const params = new URLSearchParams({ days: String(days) });
  if (cityId) params.set("cityId", String(cityId));
  return apiFetch<MetricsTimeseries>(`/metrics/timeseries?${params.toString()}`, { token }).then(
    extractData<MetricsTimeseries>,
  );
}

export function getRecentUsers(token: string, limit = 20, type?: string): Promise<RecentUser[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (type) params.set("type", type);
  return list<RecentUser>(`/users/recent?${params.toString()}`, token);
}

export function getAudienceOverview(token: string, days: number): Promise<AudienceOverview> {
  return apiFetch<AudienceOverview>(`/analytics/audience/overview?days=${days}`, { token }).then(
    extractData<AudienceOverview>,
  );
}

export function getTeamsTop(token: string, days: number, limit = 6): Promise<TeamsTop> {
  return apiFetch<TeamsTop>(`/analytics/teams/top?days=${days}&limit=${limit}`, { token }).then(extractData<TeamsTop>);
}

export function getAnalyticsAssets(token: string): Promise<AnalyticsAssets> {
  return apiFetch<AnalyticsAssets>("/analytics/assets", { token }).then(extractData<AnalyticsAssets>);
}

export function getAnalyticsFeatures(token: string, days: number): Promise<AnalyticsFeatures> {
  return apiFetch<AnalyticsFeatures>(`/analytics/features?days=${days}`, { token }).then(
    extractData<AnalyticsFeatures>,
  );
}

export function getAudienceGrowth(token: string, days: number): Promise<AudienceGrowth> {
  return apiFetch<AudienceGrowth>(`/analytics/audience/growth?days=${days}`, { token }).then(
    extractData<AudienceGrowth>,
  );
}

export function getAcquisitionFunnel(token: string, days: number): Promise<AcquisitionFunnel> {
  return apiFetch<AcquisitionFunnel>(`/analytics/acquisition/funnel?days=${days}`, { token }).then(
    extractData<AcquisitionFunnel>,
  );
}

export function getEngagementStates(token: string, days: number): Promise<EngagementStates> {
  return apiFetch<EngagementStates>(`/analytics/engagement/states?days=${days}`, { token }).then(
    extractData<EngagementStates>,
  );
}

export function getConversionsOverview(token: string, days: number): Promise<ConversionsOverview> {
  return apiFetch<ConversionsOverview>(`/analytics/conversions/overview?days=${days}`, { token }).then(
    extractData<ConversionsOverview>,
  );
}

// ============================================================
// PRODUCTIVITY — departamentos, membros e tarefas
// ============================================================

export function getDepartments(token: string): Promise<DepartmentItem[]> {
  return list<DepartmentItem>("/productivity/departments", token);
}

export function getDepartment(token: string, id: number): Promise<DepartmentItem> {
  return apiFetch<DepartmentItem>(`/productivity/departments/${id}`, { token }).then(extractData<DepartmentItem>);
}

export function getTasks(token: string): Promise<TaskItem[]> {
  return list<TaskItem>("/productivity/tasks", token);
}

export function getMemberCatalog(token: string): Promise<MemberInfo[]> {
  return list<MemberInfo>("/productivity/members", token);
}

export function createDepartment(token: string, input: DepartmentInput): Promise<DepartmentItem> {
  return apiFetch<DepartmentItem>("/productivity/departments", { method: "POST", body: input, token }).then(
    extractData<DepartmentItem>,
  );
}

export function updateDepartment(token: string, id: number, input: Partial<DepartmentInput>): Promise<DepartmentItem> {
  return apiFetch<DepartmentItem>(`/productivity/departments/${id}`, {
    method: "PUT",
    body: input,
    token,
  }).then(extractData<DepartmentItem>);
}

export function deleteDepartment(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/productivity/departments/${id}`, { method: "DELETE", token });
}

export function addDepartmentMember(token: string, departmentId: number, userId: number): Promise<void> {
  return apiFetch<void>(`/productivity/departments/${departmentId}/members`, {
    method: "POST",
    body: { userId },
    token,
  });
}

export function removeDepartmentMember(token: string, departmentId: number, userId: number): Promise<void> {
  return apiFetch<void>(`/productivity/departments/${departmentId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function createTask(token: string, input: TaskInput): Promise<TaskItem> {
  return apiFetch<TaskItem>("/productivity/tasks", { method: "POST", body: input, token }).then(extractData<TaskItem>);
}

export function updateTask(token: string, id: number, input: Partial<TaskInput>): Promise<TaskItem> {
  return apiFetch<TaskItem>(`/productivity/tasks/${id}`, { method: "PUT", body: input, token }).then(
    extractData<TaskItem>,
  );
}

export function deleteTask(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/productivity/tasks/${id}`, { method: "DELETE", token });
}

// ============================================================
// STORE — catálogo, stock e métricas da loja
// ============================================================

export function getStoreCategories(token: string): Promise<StoreCatalogItem[]> {
  return list<StoreCatalogItem>("/store/categories", token);
}

export function getStoreBrands(token: string): Promise<StoreCatalogItem[]> {
  return list<StoreCatalogItem>("/store/brands", token);
}

export function getStoreProducts(token: string): Promise<StoreProduct[]> {
  return list<StoreProduct>("/store/products", token);
}

export function getStoreProduct(token: string, id: number): Promise<StoreProduct> {
  return apiFetch<StoreProduct>(`/store/products/${id}`, { token }).then(extractData<StoreProduct>);
}

export function getStoreInventory(token: string): Promise<InventoryRow[]> {
  return list<InventoryRow>("/store/inventory", token);
}

export function getStoreStockMovements(token: string, limit = 50): Promise<StockMovement[]> {
  return list<StockMovement>(`/store/stock-movements?limit=${limit}`, token);
}

export function getStoreProductImages(token: string, productId: number): Promise<StoreProductImage[]> {
  return list<StoreProductImage>(`/store/products/${productId}/images`, token);
}

export function createStoreProductImage(
  token: string,
  productId: number,
  input: { url: string; altText?: string | null; position?: number; variantId?: number | null },
): Promise<StoreProductImage> {
  return apiFetch<StoreProductImage>(`/store/products/${productId}/images`, {
    method: "POST",
    body: input,
    token,
  }).then(extractData<StoreProductImage>);
}

export function deleteStoreProductImage(token: string, imageId: number): Promise<void> {
  return apiFetch<void>(`/store/images/${imageId}`, { method: "DELETE", token });
}

export function getStoreMetrics(token: string): Promise<StoreMetrics> {
  return apiFetch<StoreMetrics>("/store/metrics/overview", { token }).then(extractData<StoreMetrics>);
}

/** GET /store/analytics/overview — visão geral de receita, encomendas, clientes e stock. */
export function getStoreOverview(token: string, days = 14): Promise<StoreOverview> {
  return apiFetch<StoreOverview>(`/store/analytics/overview?days=${days}`, { token }).then(extractData<StoreOverview>);
}

export function createStoreCategory(token: string, input: CatalogInput): Promise<StoreCatalogItem> {
  return apiFetch<StoreCatalogItem>("/store/categories", { method: "POST", body: input, token }).then(
    extractData<StoreCatalogItem>,
  );
}

export function updateStoreCategory(
  token: string,
  id: number,
  input: Partial<CatalogInput>,
): Promise<StoreCatalogItem> {
  return apiFetch<StoreCatalogItem>(`/store/categories/${id}`, { method: "PUT", body: input, token }).then(
    extractData<StoreCatalogItem>,
  );
}

export function deleteStoreCategory(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/store/categories/${id}`, { method: "DELETE", token });
}

export function createStoreBrand(token: string, input: CatalogInput): Promise<StoreCatalogItem> {
  return apiFetch<StoreCatalogItem>("/store/brands", { method: "POST", body: input, token }).then(
    extractData<StoreCatalogItem>,
  );
}

export function updateStoreBrand(token: string, id: number, input: Partial<CatalogInput>): Promise<StoreCatalogItem> {
  return apiFetch<StoreCatalogItem>(`/store/brands/${id}`, { method: "PUT", body: input, token }).then(
    extractData<StoreCatalogItem>,
  );
}

export function deleteStoreBrand(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/store/brands/${id}`, { method: "DELETE", token });
}

export function createStoreProduct(token: string, input: ProductInput): Promise<StoreProduct> {
  return apiFetch<StoreProduct>("/store/products", { method: "POST", body: input, token }).then(
    extractData<StoreProduct>,
  );
}

export function updateStoreProduct(token: string, id: number, input: Partial<ProductInput>): Promise<StoreProduct> {
  return apiFetch<StoreProduct>(`/store/products/${id}`, { method: "PUT", body: input, token }).then(
    extractData<StoreProduct>,
  );
}

export function deleteStoreProduct(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/store/products/${id}`, { method: "DELETE", token });
}

export function createStoreVariant(token: string, productId: number, input: VariantInput): Promise<StoreVariant> {
  return apiFetch<StoreVariant>(`/store/products/${productId}/variants`, {
    method: "POST",
    body: input,
    token,
  }).then(extractData<StoreVariant>);
}

export function updateStoreVariant(token: string, id: number, input: Partial<VariantInput>): Promise<StoreVariant> {
  return apiFetch<StoreVariant>(`/store/variants/${id}`, { method: "PUT", body: input, token }).then(
    extractData<StoreVariant>,
  );
}

export function deleteStoreVariant(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/store/variants/${id}`, { method: "DELETE", token });
}

export function adjustStoreStock(token: string, variantId: number, input: StockAdjustInput): Promise<InventoryRow> {
  return apiFetch<InventoryRow>(`/store/inventory/${variantId}`, {
    method: "PATCH",
    body: input,
    token,
  }).then(extractData<InventoryRow>);
}

// ============================================================
// STORE — ENCOMENDAS (ciclo de vida completo)
// ============================================================

export interface StoreOrderQuery {
  all?: boolean;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function getStoreOrders(token: string, query: StoreOrderQuery = {}): Promise<StoreOrderList> {
  const params = new URLSearchParams();
  if (query.all) params.set("all", "true");
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const qs = params.toString();
  const path = qs ? `/store/orders?${qs}` : "/store/orders";
  return apiFetch<StoreOrderList>(path, { token }).then(extractData<StoreOrderList>);
}

export function getStoreOrder(token: string, id: number): Promise<StoreOrderDetail> {
  return apiFetch<StoreOrderDetail>(`/store/orders/${id}`, { token }).then(extractData<StoreOrderDetail>);
}

export function cancelStoreOrder(token: string, id: number, reason?: string): Promise<StoreOrderDetail> {
  return apiFetch<StoreOrderDetail>(`/store/orders/${id}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
    token,
  }).then(extractData<StoreOrderDetail>);
}

export function confirmStoreOrderPayment(token: string, id: number, paymentId?: number): Promise<StoreOrderDetail> {
  return apiFetch<StoreOrderDetail>(`/store/orders/${id}/confirm-payment`, {
    method: "POST",
    body: paymentId !== undefined ? { paymentId } : {},
    token,
  }).then(extractData<StoreOrderDetail>);
}

export function processStoreOrder(token: string, id: number): Promise<StoreOrderRow> {
  return apiFetch<StoreOrderRow>(`/store/orders/${id}/process`, { method: "POST", token }).then(
    extractData<StoreOrderRow>,
  );
}

export function completeStoreOrder(token: string, id: number): Promise<StoreOrderRow> {
  return apiFetch<StoreOrderRow>(`/store/orders/${id}/complete`, { method: "POST", token }).then(
    extractData<StoreOrderRow>,
  );
}

export function prepareStoreShipment(token: string, id: number): Promise<StoreShipment> {
  return apiFetch<StoreShipment>(`/store/orders/${id}/shipment`, { method: "POST", token }).then(
    extractData<StoreShipment>,
  );
}

export function dispatchStoreShipment(
  token: string,
  id: number,
  input: { trackingCode?: string; carrier?: string } = {},
): Promise<StoreShipment> {
  return apiFetch<StoreShipment>(`/store/orders/${id}/shipment/dispatch`, {
    method: "PATCH",
    body: input,
    token,
  }).then(extractData<StoreShipment>);
}

export function deliverStoreShipment(token: string, id: number): Promise<StoreShipment> {
  return apiFetch<StoreShipment>(`/store/orders/${id}/shipment/delivered`, {
    method: "PATCH",
    token,
  }).then(extractData<StoreShipment>);
}

// ============================================================
// STORE — DEVOLUÇÕES E REEMBOLSOS
// ============================================================

export function getStoreReturnPolicy(token: string): Promise<StoreReturnPolicy> {
  return apiFetch<StoreReturnPolicy>("/store/returns/policy", { token }).then(extractData<StoreReturnPolicy>);
}

export function updateStoreReturnPolicy(
  token: string,
  input: Pick<StoreReturnPolicy, "enabled" | "windowDays" | "allowChangeOfMind">,
): Promise<StoreReturnPolicy> {
  return apiFetch<StoreReturnPolicy>("/store/returns/policy", { method: "PUT", token, body: input }).then(
    extractData<StoreReturnPolicy>,
  );
}

export function getStoreReturns(token: string, status?: string): Promise<StoreReturnRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<StoreReturnRequest[]>(`/store/returns${query}`, { token }).then(extractData<StoreReturnRequest[]>);
}

export function getOrderReturns(token: string, orderId: number): Promise<StoreReturnRequest[]> {
  return apiFetch<StoreReturnRequest[]>(`/store/orders/${orderId}/returns`, { token }).then(
    extractData<StoreReturnRequest[]>,
  );
}

export function createOrderReturn(
  token: string,
  orderId: number,
  input: {
    reason: StoreReturnReason;
    description: string;
    items: Array<{ orderItemId: number; quantity: number }>;
  },
): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/orders/${orderId}/returns`, {
    method: "POST",
    token,
    body: input,
  }).then(extractData<StoreReturnRequest>);
}

export function reviewStoreReturn(
  token: string,
  id: number,
  input: { decision: "APPROVE" | "REJECT"; note: string },
): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/returns/${id}/review`, { method: "PATCH", token, body: input }).then(
    extractData<StoreReturnRequest>,
  );
}

export function setStoreReturnTracking(
  token: string,
  id: number,
  input: { carrier: string; trackingCode: string },
): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/returns/${id}/tracking`, { method: "PATCH", token, body: input }).then(
    extractData<StoreReturnRequest>,
  );
}

export function receiveStoreReturn(
  token: string,
  id: number,
  input: {
    carrier?: string;
    trackingCode?: string;
    items: Array<{ orderItemId: number; quantityReceived: number }>;
  },
): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/returns/${id}/receive`, { method: "PATCH", token, body: input }).then(
    extractData<StoreReturnRequest>,
  );
}

export function inspectStoreReturn(
  token: string,
  id: number,
  input: {
    items: Array<{
      orderItemId: number;
      quantityAccepted: number;
      quantityRestocked: number;
      inspectionNote?: string;
    }>;
  },
): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/returns/${id}/inspect`, { method: "PATCH", token, body: input }).then(
    extractData<StoreReturnRequest>,
  );
}

export function recordStoreReturnRefund(
  token: string,
  id: number,
  input: { method: string; reference: string; note: string },
): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/returns/${id}/refund`, { method: "PATCH", token, body: input }).then(
    extractData<StoreReturnRequest>,
  );
}

export function closeStoreReturn(token: string, id: number, note: string): Promise<StoreReturnRequest> {
  return apiFetch<StoreReturnRequest>(`/store/returns/${id}/close`, { method: "PATCH", token, body: { note } }).then(
    extractData<StoreReturnRequest>,
  );
}
