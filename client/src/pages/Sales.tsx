import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import {
  DollarSign,
  PhoneCall,
  Users,
  Target,
  TrendingUp,
  Phone,
  MessageSquare,
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import DateRangePicker from "@/components/DateRangePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type AssignmentField = "closer" | "setter";

interface PaymentRowData {
  id: number;
  date: string;
  name: string;
  cc: number;
  closer: string;
  setter: string;
  assignedCloserId: number | null;
  assignedSetterId: number | null;
}

interface AssignmentMutationVariables {
  paymentId: number;
  field: AssignmentField;
  value: number | null;
}

export default function Sales() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedCloser, setSelectedCloser] = useState<string>("");
  const [selectedSetter, setSelectedSetter] = useState<string>("");
  const [selectedDmSetter, setSelectedDmSetter] = useState<string>("");
  const [pendingAssignments, setPendingAssignments] = useState<
    Record<number, Partial<Record<AssignmentField, number | null>>>
  >({});
  const [updatingAssignments, setUpdatingAssignments] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const closersQueryKey = ["/api/sales/closers", dateRange, selectedCloser] as const;

  // Fetch top cards
  const { data: topCards, isLoading: topCardsLoading } = useQuery({
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

  // Fetch closers data
  const { data: closersData, isLoading: closersLoading } = useQuery({
    queryKey: closersQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      if (selectedCloser) params.append("member", selectedCloser);
      const res = await fetch(`/api/sales/closers?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch closers data");
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Fetch setters data
  const { data: settersData, isLoading: settersLoading } = useQuery({
    queryKey: ["/api/sales/setters", dateRange, selectedSetter],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      if (selectedSetter) params.append("member", selectedSetter);
      const res = await fetch(`/api/sales/setters?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch setters data");
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Fetch DM setters data
  const { data: dmSettersData, isLoading: dmSettersLoading } = useQuery({
    queryKey: ["/api/sales/dm-setters", dateRange, selectedDmSetter],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      if (selectedDmSetter) params.append("member", selectedDmSetter);
      const res = await fetch(`/api/sales/dm-setters?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch DM setters data");
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Fetch team members for dropdowns
  const { data: teamMembers, isLoading: teamMembersLoading } = useQuery({
    queryKey: ["/api/team-members"],
    queryFn: async () => {
      const res = await fetch("/api/team-members", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
  });

  const closers =
    teamMembers?.members.filter((m: any) => m.role === "CLOSER") || [];
  const setters =
    teamMembers?.members.filter((m: any) => m.role === "SETTER") || [];
  const setterAssignmentOptions =
    teamMembers?.members.filter(
      (m: any) => m.role === "SETTER" || m.role === "DM_SETTER"
    ) || [];
  const dmSetters =
    teamMembers?.members.filter((m: any) => m.role === "DM_SETTER") || [];

  const getAssignmentKey = (paymentId: number, field: AssignmentField) =>
    `${paymentId}-${field}`;

  const getAssignmentName = (
    field: AssignmentField,
    value: number | null,
    fallback: string
  ) => {
    if (value === null) {
      return "Unassigned";
    }
    const pool = field === "closer" ? closers : setterAssignmentOptions;
    const match = pool.find((member: any) => member.id === value);
    return match?.name || fallback || "Unassigned";
  };

  const updateLocalPaymentAssignment = (
    paymentId: number,
    field: AssignmentField,
    value: number | null
  ) => {
    queryClient.setQueryData(closersQueryKey, (oldData: any) => {
      if (!oldData?.payments) return oldData;
      return {
        ...oldData,
        payments: oldData.payments.map((payment: PaymentRowData) => {
          if (payment.id !== paymentId) return payment;
          if (field === "closer") {
            return {
              ...payment,
              assignedCloserId: value,
              closer: getAssignmentName("closer", value, payment.closer),
            };
          }
          return {
            ...payment,
            assignedSetterId: value,
            setter: getAssignmentName("setter", value, payment.setter),
          };
        }),
      };
    });
  };

  const clearPendingAssignment = (paymentId: number, field: AssignmentField) => {
    setPendingAssignments((prev) => {
      const entry = prev[paymentId];
      if (!entry || !Object.prototype.hasOwnProperty.call(entry, field)) {
        return prev;
      }
      const updatedEntry = { ...entry };
      delete updatedEntry[field];
      const next = { ...prev };
      if (Object.keys(updatedEntry).length === 0) {
        delete next[paymentId];
        return next;
      }
      next[paymentId] = updatedEntry;
      return next;
    });
  };

  const getAssignmentValue = (row: PaymentRowData, field: AssignmentField) => {
    const pendingEntry = pendingAssignments[row.id];
    if (pendingEntry && Object.prototype.hasOwnProperty.call(pendingEntry, field)) {
      const pendingValue = pendingEntry[field];
      return pendingValue === null ? "unassigned" : String(pendingValue);
    }
    const baseValue =
      field === "closer" ? row.assignedCloserId : row.assignedSetterId;
    return baseValue === null || typeof baseValue === "undefined"
      ? "unassigned"
      : String(baseValue);
  };

  const getAssignmentOptions = (row: PaymentRowData, field: AssignmentField) => {
    const pool = field === "closer" ? closers : setterAssignmentOptions;
    const currentId =
      field === "closer" ? row.assignedCloserId : row.assignedSetterId;
    const currentName = field === "closer" ? row.closer : row.setter;
    if (
      currentId != null &&
      !pool.some((member: any) => member.id === currentId)
    ) {
      return [...pool, { id: currentId, name: currentName }];
    }
    return pool;
  };

  const updatePaymentAssignment = useMutation({
    mutationFn: async ({ paymentId, field, value }: AssignmentMutationVariables) => {
      const payload =
        field === "closer"
          ? { assignedCloserId: value }
          : { assignedSetterId: value };

      const res = await fetch(`/api/payments/${paymentId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update assignment");
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      updateLocalPaymentAssignment(variables.paymentId, variables.field, variables.value);
      queryClient.invalidateQueries({ queryKey: ["/api/sales/closers"] });
      toast({
        title: "Assignment updated",
        description:
          variables.field === "closer"
            ? "Closer assignment saved."
            : "Setter assignment saved.",
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Unable to update assignment",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    },
    onSettled: (_data, _error, variables) => {
      if (variables) {
        clearPendingAssignment(variables.paymentId, variables.field);
        const mutationKey = getAssignmentKey(variables.paymentId, variables.field);
        setUpdatingAssignments((prev) => {
          if (!prev[mutationKey]) {
            return prev;
          }
          const next = { ...prev };
          delete next[mutationKey];
          return next;
        });
      }
    },
  });

  const handleAssignmentChange = (
    row: PaymentRowData,
    field: AssignmentField,
    selectedValue: string
  ) => {
    const parsedValue =
      selectedValue === "unassigned" ? null : Number(selectedValue);

    if (parsedValue !== null && Number.isNaN(parsedValue)) {
      return;
    }

    const pendingEntry = pendingAssignments[row.id];
    let currentValue =
      field === "closer"
        ? row.assignedCloserId ?? null
        : row.assignedSetterId ?? null;

    if (
      pendingEntry &&
      Object.prototype.hasOwnProperty.call(pendingEntry, field)
    ) {
      currentValue = pendingEntry[field] ?? null;
    }

    if (currentValue === parsedValue) {
      return;
    }

    setPendingAssignments((prev) => {
      const entry = prev[row.id] || {};
      return {
        ...prev,
        [row.id]: {
          ...entry,
          [field]: parsedValue,
        },
      };
    });
    const mutationKey = getAssignmentKey(row.id, field);
    setUpdatingAssignments((prev) => ({ ...prev, [mutationKey]: true }));
    updatePaymentAssignment.mutate({
      paymentId: row.id,
      field,
      value: parsedValue,
    });
  };

  // Top cards data - Overall metrics (10 cards, sticky for all tabs)
  const topKpis = [
    {
      title: "Total Booked Calls",
      value: topCards?.totalBookedCalls?.toString() || "0",
      icon: PhoneCall,
      iconColor: "bg-blue-500",
      loading: topCardsLoading,
    },
    {
      title: "Cash Collected",
      value: topCards ? `$${topCards.cashCollected.toLocaleString()}` : "$0",
      icon: DollarSign,
      iconColor: "bg-primary",
      loading: topCardsLoading,
    },
    {
      title: "Live Calls",
      value: topCards?.liveCalls?.toString() || "0",
      icon: Phone,
      iconColor: "bg-green-500",
      loading: topCardsLoading,
    },
    {
      title: "Offers Made",
      value: topCards?.offersMade?.toString() || "0",
      icon: Target,
      iconColor: "bg-purple-500",
      loading: topCardsLoading,
    },
    {
      title: "Show-Up Rate",
      value: topCards ? `${(topCards.showUpRate * 100).toFixed(1)}%` : "0%",
      icon: TrendingUp,
      iconColor: "bg-orange-500",
      loading: topCardsLoading,
    },
    {
      title: "Outbound Dials",
      value: topCards?.outboundDials?.toString() || "0",
      icon: Phone,
      iconColor: "bg-cyan-500",
      loading: topCardsLoading,
    },
    {
      title: "DMs Sent",
      value: topCards?.dmsSent?.toString() || "0",
      icon: MessageSquare,
      iconColor: "bg-pink-500",
      loading: topCardsLoading,
    },
    {
      title: "Pickups",
      value: topCards?.pickups?.toString() || "0",
      icon: PhoneCall,
      iconColor: "bg-teal-500",
      loading: topCardsLoading,
    },
    {
      title: "New Students",
      value: topCards?.newStudents?.toString() || "0",
      icon: Users,
      iconColor: "bg-sky-500",
      loading: topCardsLoading,
    },
    {
      title: "Company Monthly Pacing",
      value: topCards
        ? `$${topCards.companyMonthlyPacing.toLocaleString()}`
        : "$0",
      icon: TrendingUp,
      iconColor: "bg-indigo-500",
      loading: topCardsLoading,
    },
  ];

  // Closers metrics cards (10 cards in Closers section)
  const closersMetricsKpis = closersData?.metrics
    ? [
      {
        title: "Total Booked Calls",
        value: closersData.metrics.totalBookedCalls.toString(),
        icon: PhoneCall,
        iconColor: "bg-blue-500",
      },
      {
        title: "Live Calls",
        value: closersData.metrics.liveCalls.toString(),
        icon: Phone,
        iconColor: "bg-green-500",
      },
      {
        title: "Offers Made",
        value: closersData.metrics.offersMade.toString(),
        icon: Target,
        iconColor: "bg-purple-500",
      },
      {
        title: "Closes",
        value: closersData.metrics.closes.toString(),
        icon: Target,
        iconColor: "bg-purple-500",
      },
      {
        title: "Offer Rate",
        value: `${(closersData.metrics.offerRate * 100).toFixed(1)}%`,
        icon: Target,
        iconColor: "bg-blue-500",
      },
      {
        title: "Offer to Close Rate",
        value: `${(closersData.metrics.offerToCloseRate * 100).toFixed(1)}%`,
        icon: TrendingUp,
        iconColor: "bg-green-500",
      },
      {
        title: "Close Rate",
        value: `${(closersData.metrics.closeRate * 100).toFixed(1)}%`,
        icon: Target,
        iconColor: "bg-indigo-500",
      },
      {
        title: "Cash Collected/Live Call",
        value: `$${closersData.metrics.cashPerLiveCall.toFixed(0)}`,
        icon: DollarSign,
        iconColor: "bg-primary",
      },
      {
        title: "Avg CC / Day",
        value: `$${closersData.metrics.avgCashPerDay.toFixed(0)}`,
        icon: DollarSign,
        iconColor: "bg-orange-500",
      },
      {
        title: "Cash Collected",
        value: `$${closersData.metrics.closedWonRevenueMTD.toLocaleString()}`,
        icon: DollarSign,
        iconColor: "bg-emerald-500",
      },
      {
        title: "Upcoming Calls",
        value: closersData.metrics.callsOnCalendar.toString(),
        icon: PhoneCall,
        iconColor: "bg-blue-500",
      },
    ]
    : [];

  // Setters metrics cards (9 cards)
  const settersMetricsKpis = settersData?.metrics
    ? [
      {
        title: "Outbound Dials",
        value: settersData.metrics.outboundDials.toString(),
        icon: Phone,
        iconColor: "bg-cyan-500",
      },
      {
        title: "Pick-ups",
        value: settersData.metrics.pickUps.toString(),
        icon: PhoneCall,
        iconColor: "bg-green-500",
      },
      {
        title: "Booked Calls",
        value: settersData.metrics.bookedCalls.toString(),
        icon: Target,
        iconColor: "bg-purple-500",
      },
      {
        title: "Reschedules",
        value: settersData.metrics.reschedules.toString(),
        icon: PhoneCall,
        iconColor: "bg-amber-500",
      },
      {
        title: "Closed Won",
        value: settersData.metrics.closedWon.toString(),
        icon: Users,
        iconColor: "bg-cyan-500",
      },
      {
        title: "CC",
        value: `$${settersData.metrics.cashCollected.toLocaleString()}`,
        icon: DollarSign,
        iconColor: "bg-green-600",
      },
      {
        title: "Pick Up to Booked Call %",
        value: `${(settersData.metrics.pickUpToBookedPct * 100).toFixed(1)}%`,
        icon: TrendingUp,
        iconColor: "bg-blue-500",
      },
      {
        title: "CC/day",
        value: `$${settersData.metrics.cashPerDay.toFixed(0)}`,
        icon: DollarSign,
        iconColor: "bg-orange-500",
      },
      {
        title: "CC/Booked Call",
        value: `$${settersData.metrics.cashPerBookedCall.toFixed(0)}`,
        icon: DollarSign,
        iconColor: "bg-primary",
      },
    ]
    : [];

  // DM Setters metrics cards (11 cards)
  const dmSettersMetricsKpis = dmSettersData?.metrics
    ? [
      {
        title: "DMs Outbound",
        value: dmSettersData.metrics.dmsOutbound.toString(),
        icon: MessageSquare,
        iconColor: "bg-pink-500",
      },
      {
        title: "DMs Inbound",
        value: dmSettersData.metrics.dmsInbound.toString(),
        icon: MessageSquare,
        iconColor: "bg-violet-500",
      },
      {
        title: "Booked Calls",
        value: dmSettersData.metrics.bookedCalls.toString(),
        icon: PhoneCall,
        iconColor: "bg-blue-500",
      },
      {
        title: "Follow Ups",
        value: dmSettersData.metrics.followUps.toString(),
        icon: Target,
        iconColor: "bg-amber-500",
      },
      {
        title: "Sets Taken",
        value: dmSettersData.metrics.setsTaken.toString(),
        icon: Users,
        iconColor: "bg-cyan-600",
      },
      {
        title: "Closed Won",
        value: dmSettersData.metrics.closedWon.toString(),
        icon: Users,
        iconColor: "bg-green-600",
      },
      {
        title: "CC",
        value: `$${dmSettersData.metrics.cashCollected.toLocaleString()}`,
        icon: DollarSign,
        iconColor: "bg-emerald-600",
      },
      {
        title: "Conversation Rate",
        value: `${(dmSettersData.metrics.conversationRate * 100).toFixed(1)}%`,
        icon: TrendingUp,
        iconColor: "bg-purple-500",
      },
      {
        title: "Booking Rate",
        value: `${(dmSettersData.metrics.bookingRate * 100).toFixed(1)}%`,
        icon: TrendingUp,
        iconColor: "bg-green-500",
      },
      {
        title: "CC/Day",
        value: `$${dmSettersData.metrics.cashPerDay.toFixed(0)}`,
        icon: DollarSign,
        iconColor: "bg-orange-500",
      },
      {
        title: "CC/Booked Call",
        value: `$${dmSettersData.metrics.cashPerBookedCall.toFixed(0)}`,
        icon: DollarSign,
        iconColor: "bg-primary",
      },
    ]
    : [];

  // Closer Performance table columns
  const closerPerfColumns = [
    { key: "rep", header: "Rep" },
    {
      key: "liveCalls",
      header: "Live Calls",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "callsOnCalendar",
      header: "On Calendar",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "offerToClosePct",
      header: "Offer to Close %",
      render: (value: number) => (
        <span className="font-mono">{(value * 100).toFixed(1)}%</span>
      ),
    },
    {
      key: "closePct",
      header: "Close %",
      render: (value: number) => (
        <span className="font-mono font-semibold text-green-600">
          {(value * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: "ccPerLiveCall",
      header: "CC/Live Call",
      render: (value: number) => (
        <span className="font-mono">${value.toFixed(0)}</span>
      ),
    },
    {
      key: "ccByRep",
      header: "CC by Rep",
      render: (value: number) => (
        <span className="font-mono font-semibold">
          ${value.toLocaleString()}
        </span>
      ),
    },
  ];

  // Payments table columns
  const paymentsColumns = [
    { key: "date", header: "Date" },
    { key: "name", header: "Name" },
    {
      key: "cc",
      header: "CC",
      render: (value: number) => (
        <span className="font-mono font-semibold text-green-600">
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "closer",
      header: "Closer",
      render: (_value: string, row: PaymentRowData) => {
        const options = getAssignmentOptions(row, "closer");
        const value = getAssignmentValue(row, "closer");
        const isDisabled =
          teamMembersLoading ||
          !!updatingAssignments[getAssignmentKey(row.id, "closer")];

        return (
          <Select
            value={value}
            onValueChange={(val) => handleAssignmentChange(row, "closer", val)}
            disabled={isDisabled}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assign closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {options.map((closer: any) => (
                <SelectItem key={`closer-${closer.id}`} value={String(closer.id)}>
                  {closer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      key: "setter",
      header: "Setter",
      render: (_value: string, row: PaymentRowData) => {
        const options = getAssignmentOptions(row, "setter");
        const value = getAssignmentValue(row, "setter");
        const isDisabled =
          teamMembersLoading ||
          !!updatingAssignments[getAssignmentKey(row.id, "setter")];

        return (
          <Select
            value={value}
            onValueChange={(val) => handleAssignmentChange(row, "setter", val)}
            disabled={isDisabled}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Assign setter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {options.map((setter: any) => (
                <SelectItem key={`setter-${setter.id}`} value={String(setter.id)}>
                  {setter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  const renderRecentPayments = () => {
    if (closersLoading) {
      return (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      );
    }

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
        <DataTable
          columns={paymentsColumns}
          data={(closersData?.payments as PaymentRowData[]) || []}
          pageSize={20}
        />
      </div>
    );
  };

  // Setter Performance table columns
  const setterPerfColumns = [
    { key: "rep", header: "Rep" },
    {
      key: "callsMade",
      header: "Calls Made",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "pickUps",
      header: "Pick-Ups",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "bookedCalls",
      header: "Booked Calls",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "closedWon",
      header: "Closed Won",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "ccBySetter",
      header: "CC by Setter",
      render: (value: number) => (
        <span className="font-mono font-semibold">
          ${value.toLocaleString()}
        </span>
      ),
    },
  ];

  // DM Setter Performance table columns
  const dmSetterPerfColumns = [
    { key: "rep", header: "Rep" },
    {
      key: "newOutboundConvos",
      header: "New Convos",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "outboundResponses",
      header: "Responses",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "totalCallsBooked",
      header: "Calls Booked",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "closedWon",
      header: "Closed Won",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "ccByDmSetter",
      header: "CC by DM Setter",
      render: (value: number) => (
        <span className="font-mono font-semibold">
          ${value.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8" data-testid="page-sales">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Sales Dashboard
        </h1>
        <DateRangePicker
          onRangeChange={(from, to) => setDateRange({ from, to })}
        />
      </div>

      {/* Top KPI Cards (8 cards, sticky for all tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topKpis.map((kpi, idx) => (
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

      {/* Tabs for different team roles */}
      <Tabs defaultValue="closers" className="w-full">
        <TabsList>
          <TabsTrigger value="closers" data-testid="tab-closers">
            Closers
          </TabsTrigger>
          <TabsTrigger value="setters" data-testid="tab-setters">
            Setters
          </TabsTrigger>
          <TabsTrigger value="dm-setters" data-testid="tab-dm-setters">
            DM Setters
          </TabsTrigger>
        </TabsList>

        {/* Closers Tab */}
        <TabsContent value="closers" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Closer Metrics</h3>
            <Select
              value={selectedCloser || "all"}
              onValueChange={(val) =>
                setSelectedCloser(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-64" data-testid="select-closer">
                <SelectValue placeholder="All Closers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Closers</SelectItem>
                {closers.map((closer: any) => (
                  <SelectItem key={closer.id} value={closer.name}>
                    {closer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {closersLoading ? (
            <Card className="p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {closersMetricsKpis.map((kpi, idx) => (
                  <KpiCard key={idx} {...kpi} />
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Closer Performance
                </h3>
                <DataTable
                  columns={closerPerfColumns}
                  data={closersData?.performance || []}
                />
              </div>

              {renderRecentPayments()}
            </>
          )}
        </TabsContent>

        {/* Setters Tab */}
        <TabsContent value="setters" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Setter Metrics</h3>
            <Select
              value={selectedSetter || "all"}
              onValueChange={(val) =>
                setSelectedSetter(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-64" data-testid="select-setter">
                <SelectValue placeholder="All Setters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Setters</SelectItem>
                {setters.map((setter: any) => (
                  <SelectItem key={setter.id} value={setter.name}>
                    {setter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settersLoading ? (
            <Card className="p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {settersMetricsKpis.map((kpi, idx) => (
                  <KpiCard key={idx} {...kpi} />
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Setter Performance
                </h3>
                <DataTable
                  columns={setterPerfColumns}
                  data={settersData?.performance || []}
                />
              </div>

              {renderRecentPayments()}
            </>
          )}
        </TabsContent>

        {/* DM Setters Tab */}
        <TabsContent value="dm-setters" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">DM Setter Metrics</h3>
            <Select
              value={selectedDmSetter || "all"}
              onValueChange={(val) =>
                setSelectedDmSetter(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-64" data-testid="select-dm-setter">
                <SelectValue placeholder="All DM Setters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All DM Setters</SelectItem>
                {dmSetters.map((dmSetter: any) => (
                  <SelectItem key={dmSetter.id} value={dmSetter.name}>
                    {dmSetter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dmSettersLoading ? (
            <Card className="p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dmSettersMetricsKpis.map((kpi, idx) => (
                  <KpiCard key={idx} {...kpi} />
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  DM Setter Performance
                </h3>
                <DataTable
                  columns={dmSetterPerfColumns}
                  data={dmSettersData?.performance || []}
                />
              </div>

              {renderRecentPayments()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
