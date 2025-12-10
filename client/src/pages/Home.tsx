import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, TrendingUp, Target, AlertCircle, RotateCcw, TrendingDown, PhoneCall, MessageSquare, Phone, Mail, MousePointerClick, AlertTriangle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import KpiCard from '@/components/KpiCard';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import DataTable from '@/components/DataTable';
import DateRangePicker from '@/components/DateRangePicker';
import {
  HomeSummaryResponse,
  SalesTopCardsResponse,
  AdsSummaryResponse,
  EmailSummaryResponse,
  HomeTransactionsResponse
} from '@/types/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [metricType, setMetricType] = useState<'closed' | 'calls' | 'dms'>('closed');
  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#a855f7'];

  // Fetch initial home summary data (cards + charts)
  const { data: summary, isLoading: summaryLoading } = useQuery<HomeSummaryResponse>({
    queryKey: ['/api/home/summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      const res = await fetch(`/api/home/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  //Fetch Sales Top Cards
  const { data: salesSummary, isLoading: salesSummaryLoading } = useQuery<SalesTopCardsResponse>({
    queryKey: ["/api/sales/top-cards", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      const res = await fetch(`/api/sales/top-cards?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch top cards");
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  //Fetch Ads Top Cards
  const { data: adsSummary, isLoading: adsSummaryLoading } = useQuery<AdsSummaryResponse>({
    queryKey: ['/api/v1/ads/summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      const res = await fetch(`/api/v1/ads/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch ads summary');
      return res.json();
    },
  });

  //Fetch Email Top Cards
  const { data: emailSummary, isLoading: emailSummaryLoading } = useQuery<EmailSummaryResponse>({
    queryKey: ['/api/v1/email/summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      const res = await fetch(`/api/v1/email/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch email summary');
      return res.json();
    },
  });



  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<HomeTransactionsResponse>({
    queryKey: ['/api/home/transactions', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
        limit: '50',
      });
      const res = await fetch(`/api/home/transactions?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const summaryKpiData = [
    {
      title: 'Net Revenue (CC)',
      value: summary ? `$${summary.cards.netRevenue.toLocaleString()}` : '$0',
      icon: DollarSign,
      loading: summaryLoading,
      variant: 'gradient-primary' as const,
    },
    {
      title: 'New Customers',
      value: summary?.cards.newCustomers?.toString() || '0',
      icon: Users,
      loading: summaryLoading,
      variant: 'gradient-accent' as const,
    },
    {
      title: 'Closed-Won Revenue',
      value: summary ? `$${summary.cards.closedWonRevenue.toLocaleString()}` : '$0',
      icon: TrendingUp,
      loading: summaryLoading,
      variant: 'gradient-cyan' as const,
    },
    // {
    //   title: 'Leads Captured',
    //   value: summary?.cards.leadsCaptured?.toString() || '0',
    //   icon: Target,
    //   loading: summaryLoading,
    //   variant: 'gradient-pink' as const,
    // },
    // {
    //   title: 'Ad Spend',
    //   value: summary ? `$${summary.cards.adSpend.toLocaleString()}` : '$0',
    //   icon: TrendingDown,
    //   iconColor: 'text-orange-500',
    //   loading: summaryLoading,
    // },
    // {
    //   title: 'Overdue Payments',
    //   value: summary ? `$${summary.cards.overduePayments.total.toLocaleString()} (${summary.cards.overduePayments.count})` : '$0 (0)',
    //   icon: AlertCircle,
    //   iconColor: 'text-red-500',
    //   loading: summaryLoading,
    // },
  ]

  const salesKpiData = [
    {
      title: "Total Booked Calls",
      value: salesSummary?.totalBookedCalls?.toString() || "0",
      icon: PhoneCall,
      iconColor: "bg-blue-500",
      loading: salesSummaryLoading,
    },
    {
      title: "Live Calls",
      value: salesSummary?.liveCalls?.toString() || "0",
      icon: Phone,
      iconColor: "bg-green-500",
      loading: salesSummaryLoading,
    },
    {
      title: "Offers Made",
      value: salesSummary?.offersMade?.toString() || "0",
      icon: Target,
      iconColor: "bg-purple-500",
      loading: salesSummaryLoading,
    },
    {
      title: "Show-Up Rate",
      value: salesSummary ? `${(salesSummary.showUpRate * 100).toFixed(1)}%` : "0%",
      icon: TrendingUp,
      iconColor: "bg-orange-500",
      loading: salesSummaryLoading,
    },
    {
      title: "Outbound Dials",
      value: salesSummary?.outboundDials?.toString() || "0",
      icon: Phone,
      iconColor: "bg-cyan-500",
      loading: salesSummaryLoading,
    },
    {
      title: "DMs Sent",
      value: salesSummary?.dmsSent?.toString() || "0",
      icon: MessageSquare,
      iconColor: "bg-pink-500",
      loading: salesSummaryLoading,
    },
    {
      title: "Pickups",
      value: salesSummary?.pickups?.toString() || "0",
      icon: PhoneCall,
      iconColor: "bg-teal-500",
      loading: salesSummaryLoading,
    },
    {
      title: "Company Monthly Pacing",
      value: salesSummary
        ? `$${salesSummary.companyMonthlyPacing.toLocaleString()}`
        : "$0",
      icon: TrendingUp,
      iconColor: "bg-indigo-500",
      loading: salesSummaryLoading,
    },
  ]
  const marketingKpiData = [
    {
      title: 'Ads - Active Campaigns',
      value: adsSummary?.activeCampaigns?.toString() || '0',
      icon: Target,
      iconColor: 'bg-orange-500',
      loading: adsSummaryLoading,
    },
    {
      title: 'Ads - Impressions',
      value: adsSummary?.impressions?.toString() || '0',
      icon: Target,
      iconColor: 'bg-orange-500',
      loading: adsSummaryLoading,
    },
    {
      title: 'Ads - Clicks',
      value: adsSummary?.clicks?.toString() || '0',
      icon: Target,
      iconColor: 'bg-orange-500',
      loading: adsSummaryLoading,
    },
    {
      title: 'Ads - CPL',
      value: `$${adsSummary?.cpl?.toLocaleString() || '0'}`,
      icon: Target,
      iconColor: 'bg-orange-500',
      loading: adsSummaryLoading,
    },
    {
      title: "Email - Total Broadcasts",
      value: emailSummary?.totalBroadcasts?.toLocaleString() || "0",
      icon: Mail,
      iconColor: "bg-blue-500",
      loading: emailSummaryLoading,
    },
    {
      title: "Email - Avg Open Rate",
      value: `${emailSummary?.avgOpenRate || "0"}%`,
      icon: TrendingUp,
      iconColor: "bg-green-500",
      loading: emailSummaryLoading,
    },
    {
      title: "Email - Avg Click Rate",
      value: `${emailSummary?.avgClickRate || "0"}%`,
      icon: MousePointerClick,
      iconColor: "bg-purple-500",
      loading: emailSummaryLoading,
    },
    {
      title: "Email - Total Recipients",
      value: emailSummary?.totalRecipients?.toLocaleString() || "0",
      icon: Users,
      iconColor: "bg-orange-500",
      loading: emailSummaryLoading,
    },
  ]



  // Prepare chart data
  const chartSeries = summary?.charts.cashCollectedBySource
    ? [
      {
        name: 'Cash Collected',
        data: summary.charts.cashCollectedBySource.map((item: any) => item.amount),
      },
    ]
    : [];

  const chartCategories = summary?.charts.cashCollectedBySource
    ? summary.charts.cashCollectedBySource.map((item: any) => item.source)
    : [];

  const pieData = (() => {
    if (!summary?.charts) return [];
    switch (metricType) {
      case 'closed': return summary.charts.closedCallsByCloser || [];
      case 'calls': return summary.charts.callsMadeBySetter || [];
      case 'dms': return summary.charts.dmsSentByDmSetter || [];
      default: return [];
    }
  })();

  // Prepare transactions table
  const transactionsColumns = [
    { key: 'date', header: 'Date' },
    { key: 'name', header: 'Name' },
    {
      key: 'value',
      header: 'Value',
      render: (value: number) => (
        <span className="font-mono font-semibold text-green-600">
          ${value.toLocaleString()}
        </span>
      ),
    },
    //TODO: IMPLEMENT SOURCE AND LINE OF BUSINESS
    // { key: 'source', header: 'Source' },
    // { key: 'lineOfBusiness', header: 'Line of Business' },
  ];

  return (
    <div className="space-y-8" data-testid="page-home">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Home Dashboard</h1>
        <DateRangePicker onRangeChange={(from, to) => setDateRange({ from, to })} />
      </div>

      {/* Summary KPI Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryKpiData.map((kpi, idx) => (
          <KpiCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            loading={kpi.loading}
            variant={kpi.variant}
          />
        ))}
      </div>

      {/* Sales KPI Cards */}
      <div> <h2 className="text-xl font-semibold" data-testid="text-page-title">Sales Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {salesKpiData.map((kpi, idx) => (
            <KpiCard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              iconColor={kpi.iconColor}
              loading={kpi.loading}
            />
          ))}
        </div>
      </div>

      {/* Marketing KPI Cards
      <div> <h2 className="text-xl font-semibold" data-testid="text-page-title">Marketing Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketingKpiData.map((kpi, idx) => (
            <KpiCard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              iconColor={kpi.iconColor}
              loading={kpi.loading}
            />
          ))}
        </div>
      </div> */}



      {/* Cash Collected by Source Chart - COMMENTED OUT AS PER REQUEST */}
      {/* {chartSeries.length > 0 && (
        <TimeSeriesChart
          title="Cash Collected by Source"
          series={chartSeries}
          categories={chartCategories}
          type="bar"
          height={320}
        />
      )} */}

      {/* New Metrics Pie Chart */}
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {metricType === 'closed' && 'Closed Calls by Closer'}
            {metricType === 'calls' && 'Calls Made by Setter'}
            {metricType === 'dms' && 'DMs Sent by DM Setter'}
          </h3>
          <Select value={metricType} onValueChange={(v: any) => setMetricType(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="closed">Closed Calls (Closers)</SelectItem>
              <SelectItem value="calls">Calls Made (Setters)</SelectItem>
              <SelectItem value="dms">DM Sent (DM Setters)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-[320px] w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
              <p>No data available for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4" data-testid="text-transactions-title">
          Recent Transactions
        </h3>
        {transactionsLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable
            columns={transactionsColumns}
            data={transactionsData?.transactions || []}
          />
        )}
      </div>
    </div>
  );
}
