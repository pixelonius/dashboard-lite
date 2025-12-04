import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "@/components/KpiCard";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import DateRangePicker from "@/components/DateRangePicker";
import {
  BadgeDollarSign,
  BarChart,
  CircleDollarSign,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRange {
  from: Date;
  to: Date;
}

interface PerformanceMetric {
  performanceId: number;
  points: Array<{
    date: string;
    spend: number;
    impressions: number;
    leads: number;
    revenue: number;
  }>;
}

interface CampaignMetric {
  campaignId: string;
  performances: PerformanceMetric[];
}

type MetricKey = "spend" | "impressions" | "leads" | "revenue";

const metricOptions: Record<
  MetricKey,
  {
    label: string;
    key: keyof PerformanceMetric["points"][number];
    format: "currency" | "number";
  }
> = {
  spend: { label: "Ad Spend", key: "spend", format: "currency" },
  impressions: { label: "Impressions", key: "impressions", format: "number" },
  leads: { label: "Leads Captured", key: "leads", format: "number" },
  revenue: { label: "Revenue", key: "revenue", format: "currency" },
};

export default function MarketingAdSpend() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("spend");

  const { data: adsSummary, isLoading: adsSummaryLoading } = useQuery({
    queryKey: ["/api/v1/ads/summary", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const res = await fetch(`/api/v1/ads/summary?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ads summary");
      return res.json();
    },
  });

  const { data: campaignMetrics, isLoading: campaignMetricsLoading } = useQuery({
    queryKey: ["/api/v1/ads/campaign-metrics", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const res = await fetch(`/api/v1/ads/campaign-metrics?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch campaign metrics");
      return res.json();
    },
  });

  const formatCurrency = (value?: number, digits = 0) =>
    `$${(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  const formatNumber = (value?: number) =>
    (value ?? 0).toLocaleString();

  const adKpis = [
    {
      title: "Total Ad Spend",
      value: formatCurrency(adsSummary?.totalSpend),
      icon: DollarSign,
      iconColor: "bg-red-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Impressions",
      value: formatNumber(adsSummary?.impressions),
      icon: Eye,
      iconColor: "bg-blue-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Clicks",
      value: formatNumber(adsSummary?.clicks),
      icon: MousePointerClick,
      iconColor: "bg-cyan-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Leads Captured",
      value: formatNumber(adsSummary?.leadsCaptured),
      icon: Users,
      iconColor: "bg-purple-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Conversions",
      value: formatNumber(adsSummary?.conversions),
      icon: Trophy,
      iconColor: "bg-emerald-600",
      loading: adsSummaryLoading,
    },
    {
      title: "Revenue Attributed",
      value: formatCurrency(adsSummary?.revenueAttributed),
      icon: CircleDollarSign,
      iconColor: "bg-orange-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Cost per Lead",
      value: formatCurrency(adsSummary?.cpl, 2),
      icon: BadgeDollarSign,
      iconColor: "bg-teal-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Active Campaigns",
      value: adsSummary?.activeCampaigns?.toString() || "0",
      icon: Target,
      iconColor: "bg-rose-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Avg Daily Spend",
      value: formatCurrency(adsSummary?.avgDailySpend),
      icon: TrendingUp,
      iconColor: "bg-indigo-500",
      loading: adsSummaryLoading,
    },
    {
      title: "Total Platforms",
      value: adsSummary?.platformCount?.toString() || "0",
      icon: BarChart,
      iconColor: "bg-slate-500",
      loading: adsSummaryLoading,
    },
  ];

  const selectedMetricConfig = metricOptions[selectedMetric];

  const campaignData: CampaignMetric[] = campaignMetrics?.campaigns || [];
  const campaignCategories = useMemo(() => {
    const dates = new Set<string>();
    campaignData.forEach((campaign) =>
      (campaign.performances || []).forEach((performance) =>
        (performance.points || []).forEach((point) => {
          if (point?.date) {
            dates.add(point.date);
          }
        })
      )
    );
    return Array.from(dates).sort();
  }, [campaignData]);

  const campaignSeries = useMemo(() => {
    return campaignData.flatMap((campaign) =>
      (campaign.performances || []).map((performance) => {
        const points = performance.points || [];
        const data = campaignCategories.map((date) => {
          const point = points.find((p) => p.date === date);
          return point ? Number(point[selectedMetricConfig.key] ?? 0) : 0;
        });
        return {
          name: `${campaign.campaignId} • Perf ${performance.performanceId}`,
          data,
        };
      })
    );
  }, [campaignCategories, campaignData, selectedMetricConfig.key]);

  const metricAxisFormatter = useMemo(
    () => (value: number | string) => {
      const numericValue = Number(value) || 0;
      if (selectedMetricConfig.format === "currency") {
        return numericValue >= 1000
          ? `$${(numericValue / 1000).toFixed(1)}k`
          : `$${numericValue.toFixed(0)}`;
      }
      if (numericValue >= 1000) {
        if (numericValue >= 1_000_000) {
          return `${(numericValue / 1_000_000).toFixed(1)}M`;
        }
        return `${(numericValue / 1000).toFixed(1)}k`;
      }
      return numericValue.toFixed(0);
    },
    [selectedMetricConfig.format]
  );

  const metricTooltipFormatter = useMemo(
    () => (value: number | string) => {
      const numericValue = Number(value) || 0;
      return selectedMetricConfig.format === "currency"
        ? `$${numericValue.toLocaleString()}`
        : numericValue.toLocaleString();
    },
    [selectedMetricConfig.format]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold" data-testid="text-page-title">Ad Spend</h2>
        <DateRangePicker onRangeChange={(from, to) => setDateRange({ from, to })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adKpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {campaignMetricsLoading ? (
        <Card className="p-6">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        </Card>
      ) : (
        <TimeSeriesChart
          title={`${selectedMetricConfig.label} by Date / Campaign`}
          series={campaignSeries}
          categories={campaignCategories}
          type="area"
          valueFormatter={metricAxisFormatter}
          tooltipFormatter={metricTooltipFormatter}
          actionSlot={
            <Select
              value={selectedMetric}
              onValueChange={(val: MetricKey) => setSelectedMetric(val)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(metricOptions).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}
    </div>
  );
}
