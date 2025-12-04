import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import DateRangePicker from "@/components/DateRangePicker";
import StatusBadge from "@/components/StatusBadge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileText, Clock, DollarSign, Target } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

export default function MarketingContent() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [selectedEmbed, setSelectedEmbed] = useState<string>("ast");

  const { data: contentSummary, isLoading: contentSummaryLoading } = useQuery({
    queryKey: ['/api/v1/content/summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });
      const res = await fetch(`/api/v1/content/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch content summary');
      return res.json();
    },
  });

  const { data: contentItems, isLoading: contentItemsLoading } = useQuery({
    queryKey: ['/api/v1/content/items'],
    queryFn: async () => {
      const res = await fetch('/api/v1/content/items?limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch content items');
      return res.json();
    },
  });

  const contentKpis = [
    {
      title: 'Total Content Pieces',
      value: contentSummary?.totalPieces?.toString() || '0',
      icon: FileText,
      iconColor: 'bg-blue-500',
      loading: contentSummaryLoading,
    },
    {
      title: 'In Production',
      value: contentSummary?.inProduction?.toString() || '0',
      icon: Clock,
      iconColor: 'bg-yellow-500',
      loading: contentSummaryLoading,
    },
    {
      title: 'Content Spend',
      value: `$${contentSummary?.totalSpend?.toLocaleString() || '0'}`,
      icon: DollarSign,
      iconColor: 'bg-green-500',
      loading: contentSummaryLoading,
    },
    {
      title: 'Published',
      value: contentSummary?.published?.toString() || '0',
      icon: Target,
      iconColor: 'bg-purple-500',
      loading: contentSummaryLoading,
    },
  ];

  const contentColumns = [
    {
      key: 'title',
      header: 'Title',
      accessorKey: 'title',
    },
    {
      key: 'type',
      header: 'Type',
      accessorKey: 'type',
    },
    {
      key: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
    },
    {
      key: 'platform',
      header: 'Platform',
      accessorKey: 'platform',
    },
    {
      key: 'assignedEditor',
      header: 'Assigned To',
      accessorKey: 'assignedEditor',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold" data-testid="text-page-title">Content</h2>
        <div className="flex gap-4 items-center">
          <ToggleGroup 
            type="single" 
            value={selectedEmbed} 
            onValueChange={(value) => value && setSelectedEmbed(value)}
            data-testid="toggle-embed-selector"
          >
            <ToggleGroupItem value="ast" aria-label="Toggle AST" data-testid="toggle-ast">
              AST
            </ToggleGroupItem>
            <ToggleGroupItem value="josh" aria-label="Toggle Josh" data-testid="toggle-josh">
              Josh
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {selectedEmbed === "ast" && (
        <div data-testid="embed-ast">
          <iframe 
            src="https://spiffy-cent-c1b.notion.site/ebd/27b62ddeb37380ddac3aef1be5124c46" 
            width="100%" 
            height="600" 
            frameBorder="0" 
            allowFullScreen 
          />
        </div>
      )}

      {selectedEmbed === "josh" && (
        <div data-testid="embed-josh">
          <iframe 
            src="https://spiffy-cent-c1b.notion.site/ebd/27a62ddeb37380ae99e5d5676b4bbdd8" 
            width="100%" 
            height="600" 
            frameBorder="0" 
            allowFullScreen 
          />
        </div>
      )}
    </div>
  );
}
