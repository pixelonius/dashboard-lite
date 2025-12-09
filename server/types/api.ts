/**
 * API Response Types
 */

export interface DateRangeInfo {
  from: string;
  to: string;
  tz: string;
}

// ========== HOME PAGE TYPES ==========

export interface HomeCardsResponse {
  netRevenue: number;
  newCustomers: number;
  closedWonRevenue: number;
  leadsCaptured: number;
  adSpend: number;
  contentViews: { amount: number; implemented: boolean };
  overduePayments: { count: number; total: number };
  refunds: { amount: number };
  email: { implemented: boolean };
}

export interface CashBySourceItem {
  source: string;
  amount: number;
}

export interface HomeSummaryResponse {
  range: DateRangeInfo;
  cards: HomeCardsResponse;
  charts: {
    cashCollectedBySource: CashBySourceItem[];
  };
}

export interface Transaction {
  date: string;
  name: string;
  value: number;
  source: string;
  lineOfBusiness: string;
}

export interface HomeTransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// ========== SALES PAGE TYPES ==========

export interface SalesTopCardsResponse {
  totalBookedCalls: number;
  cashCollected: number;
  liveCalls: number;
  offersMade: number;
  showUpRate: number;
  outboundDials: number;
  dmsSent: number;
  pickups: number;
  newStudents: number;
  companyMonthlyPacing: number;
}

export interface ClosersMetricsResponse {
  totalBookedCalls: number;
  liveCalls: number;
  offersMade: number;
  closes: number;
  offerRate: number;
  offerToCloseRate: number;
  closeRate: number;
  cashPerLiveCall: number;
  avgCashPerDay: number;
  closedWonRevenueMTD: number;
  callsOnCalendar: number;
  reschedules: number;
  reportedRevenue: number;
}

export interface CloserPerformance {
  rep: string;
  liveCalls: number;
  closes: number;
  callsOnCalendar: number;
  offerToClosePct: number;
  closePct: number;
  ccPerLiveCall: number;
  ccByRep: number;
  reschedules: number;
  reportedRevenue: number;
}

export interface PaymentRow {
  id: number;
  date: string;
  name: string;
  cc: number;
  closer: string;
  setter: string;
  assignedCloserId: number | null;
  assignedSetterId: number | null;
}

export interface ClosersResponse {
  range: DateRangeInfo;
  metrics: ClosersMetricsResponse;
  performance: CloserPerformance[];
  payments: PaymentRow[];
}

export interface SettersMetricsResponse {
  outboundDials: number;
  pickUps: number;
  bookedCalls: number;
  reschedules: number;
  closedWon: number;
  cashCollected: number;
  pickUpToBookedPct: number;
  cashPerDay: number;
  cashPerBookedCall: number;
  monthlyPacing: number;
  reportedRevenue: number;
}

export interface SetterPerformance {
  rep: string;
  callsMade: number;
  pickUps: number;
  bookedCalls: number;
  closedWon: number;
  ccBySetter: number;
  reportedRevenue: number;
}

export interface DmSettersMetricsResponse {
  dmsOutbound: number;
  dmsInbound: number;
  bookedCalls: number;
  closedWon: number;
  cashCollected: number;
  conversationRate: number;
  bookingRate: number;
  cashPerDay: number;
  cashPerBookedCall: number;
  reportedRevenue: number;
}

export interface DmSetterPerformance {
  rep: string;
  newOutboundConvos: number;
  outboundResponses: number;
  totalCallsBooked: number;
  closedWon: number;
  ccByDmSetter: number;
  reportedRevenue: number;
}

export interface DmSettersResponse {
  range: DateRangeInfo;
  metrics: DmSettersMetricsResponse;
  performance: DmSetterPerformance[];
}

// ========== TEAM MEMBER TYPES ==========

export interface TeamMemberOption {
  id: number;
  name: string;
  role: string;
}

// ========== CSM PAGE TYPES ==========

export interface CsmSummaryResponse {
  activeMembers: number;
  totalOwed: number;
  highRiskClients: number;
  onboardingCompliancePct: number;
  overdueAmount: number;
  overdueCount: number;
  expectedPayments: number;
}

export interface HighRiskClient {
  id: number;
  name: string;
  email: string;
  program: string;
  planType?: string | null;
  installments?: number | null;
  referralName?: string | null;
  products?: string[] | null;
  totalPaid: string;
  csm: string;
  selectedOutcome: string;
  lastCheckIn: Date;
}

export interface ActiveClient {
  id: number;
  name: string;
  email: string;
  program: string;
  planType?: string | null;
  installments?: number | null;
  referralName?: string | null;
  csm: string;
  startDate: Date;
  endDate?: Date | null;
  cashCollected: number;
  contractedValue: number;
  active?: boolean | null;
  pause?: boolean | null;
  pauseStartDate?: Date | null;
  pauseEndDate?: Date | null;
  products?: string[] | null;
  notes?: string | null;
  progressTrackerSheet?: string | null;
}

export interface PaymentPlanInstallment {
  id: number;
  dueDate: Date;
  amountOwed: number;
  status: string;
  paidAt?: Date | null;
  amountPaid?: number | null;
}

export interface HighRiskClientsResponse {
  clients: HighRiskClient[];
}

export interface ActiveClientsResponse {
  clients: ActiveClient[];
}

export interface TeamMembersResponse {
  members: TeamMemberOption[];
}

export interface StudentPaymentPlan {
  planType: 'PIF' | 'Split Pay';
  installments: number | null;
  contractValue: number;
  totalPaid: number;
  remaining: number;
  schedule: PaymentPlanInstallment[];
}

// ========== ADS & EMAIL TYPES ==========

export interface AdsSummaryResponse {
  totalSpend: number;
  activeCampaigns: number;
  avgDailySpend: number;
  platformCount: number;
  impressions: number;
  clicks: number;
  leadsCaptured: number;
  conversions: number;
  cpl: number;
  revenueAttributed: number;
}

export interface EmailSummaryResponse {
  totalBroadcasts: number;
  totalRecipients: number;
  avgOpenRate: string;
  avgClickRate: string;
  totalOpens: number;
  totalClicks: number;
  totalUnsubscribes: number;
  activeBroadcasts: number;
}
