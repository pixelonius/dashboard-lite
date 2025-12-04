import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import DateRangePicker from "@/components/DateRangePicker";
import StatusBadge from "@/components/StatusBadge";
import { Mail, TrendingUp, MousePointerClick, Users } from "lucide-react";
import { EmailSummaryResponse } from "@/types/api";

interface DateRange {
  from: Date;
  to: Date;
}

export default function Email() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<EmailSummaryResponse>({
    queryKey: ['/api/v1/email/summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const res = await fetch(`/api/v1/email/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch email summary');
      return res.json();
    },
  });

  const { data: broadcastsData, isLoading: broadcastsLoading } = useQuery({
    queryKey: ['/api/v1/email/broadcasts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/email/broadcasts?limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch broadcasts');
      return res.json();
    },
  });

  const kpiData = [
    {
      title: "Total Broadcasts",
      value: summary?.totalBroadcasts?.toLocaleString() || "0",
      icon: Mail,
      iconColor: "bg-blue-500",
      loading: summaryLoading,
    },
    {
      title: "Avg Open Rate",
      value: `${summary?.avgOpenRate || "0"}%`,
      icon: TrendingUp,
      iconColor: "bg-green-500",
      loading: summaryLoading,
    },
    {
      title: "Avg Click Rate",
      value: `${summary?.avgClickRate || "0"}%`,
      icon: MousePointerClick,
      iconColor: "bg-purple-500",
      loading: summaryLoading,
    },
    {
      title: "Total Recipients",
      value: summary?.totalRecipients?.toLocaleString() || "0",
      icon: Users,
      iconColor: "bg-orange-500",
      loading: summaryLoading,
    },
  ];

  const broadcastsColumns = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Broadcast Title' },
    { key: 'subject', header: 'Subject' },
    {
      key: 'sentAt',
      header: 'Sent At',
      render: (value: string | null) => {
        if (!value) return <span className="text-muted-foreground">Not sent</span>;
        return <span className="font-mono text-sm">{new Date(value).toLocaleDateString()}</span>;
      }
    },
    {
      key: 'recipients',
      header: 'Recipients',
      render: (value: number) => <span className="font-mono">{value.toLocaleString()}</span>
    },
    {
      key: 'openRate',
      header: 'Open Rate',
      render: (value: string) => <span className="font-mono font-semibold text-green-600">{value}</span>
    },
    {
      key: 'clickRate',
      header: 'Click Rate',
      render: (value: string) => <span className="font-mono font-semibold text-blue-600">{value}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => {
        const variant = value === 'completed' ? 'success' : value === 'sending' ? 'info' : 'default';
        return <StatusBadge status={value} variant={variant} />;
      }
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold" data-testid="text-page-title">Email Broadcasts</h2>
        <DateRangePicker onRangeChange={(from, to) => setDateRange({ from, to })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Broadcasts</h3>
        <DataTable
          columns={broadcastsColumns}
          data={broadcastsData?.broadcasts || []}
          loading={broadcastsLoading}
        />
      </div>
    </div>
  );
}
