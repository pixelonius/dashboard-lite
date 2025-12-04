import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import KpiCard from '@/components/KpiCard';
import DataTable from '@/components/DataTable';
import DateRangePicker from '@/components/DateRangePicker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Users, CheckCircle, AlertTriangle, Clock, Eye, Calendar } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { StudentModal } from '@/components/StudentModal';
import {
  CsmSummaryResponse,
  HighRiskClientsResponse,
  ActiveClientsResponse,
  TeamMembersResponse
} from '@/types/api';

export default function CSM() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useQuery<CsmSummaryResponse>({
    queryKey: ['/api/v1/csm/summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from!.toISOString(),
        to: dateRange.to!.toISOString(),
      });
      const res = await fetch(`/api/v1/csm/summary?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch CSM summary');
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const { data: highRiskData, isLoading: highRiskLoading } = useQuery<HighRiskClientsResponse>({
    queryKey: ['/api/v1/csm/high-risk'],
  });

  const { data: activeClientsData, isLoading: activeClientsLoading } = useQuery<ActiveClientsResponse>({
    queryKey: ['/api/v1/csm/active-clients'],
  });

  const { data: csmMembersData } = useQuery<TeamMembersResponse>({
    queryKey: ['/api/v1/team/csm-members'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/csm-members', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch CSM members');
      return res.json();
    },
  });

  const assignCsmMutation = useMutation({
    mutationFn: async ({ studentEmail, csmFirstName }: { studentEmail: string; csmFirstName: string | null }) => {
      return apiRequest('PATCH', '/api/v1/csm/assign-csm', { studentEmail, csmFirstName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/csm/active-clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/csm/high-risk'] });
      toast({
        title: "CSM assigned successfully",
        description: "The client has been assigned to the selected CSM.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign CSM. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Top cards data
  // Top cards data
  const kpiData = [
    {
      title: 'Active Members',
      value: summary?.activeMembers?.toString() || '0',
      loading: summaryLoading,
    },
    {
      title: 'Total Owed (Payment Plans)',
      value: summary ? `$${summary.totalOwed.toLocaleString()}` : '$0',
      loading: summaryLoading,
    },
    {
      title: 'Expected Payments',
      value: summary ? `$${summary.expectedPayments.toLocaleString()}` : '$0',
      loading: summaryLoading,
    },
    {
      title: 'High-Risk Clients',
      value: summary?.highRiskClients?.toString() || '0',
      loading: summaryLoading,
    },
    {
      title: 'Onboarding Compliance',
      value: summary ? `${summary.onboardingCompliancePct.toFixed(1)}%` : '0%',
      loading: summaryLoading,
    },
  ];

  // High-risk clients table columns
  // const highRiskColumns = [
  //   {
  //     key: 'name',
  //     header: 'Name',
  //     render: (value: string) => <span className="font-medium" data-testid={`text-name-${value}`}>{value}</span>
  //   },
  //   {
  //     key: 'email',
  //     header: 'Email',
  //     render: (value: string) => <span className="text-muted-foreground" data-testid={`text-email-${value}`}>{value}</span>
  //   },
  //   {
  //     key: 'contractedValue',
  //     header: 'Contracted Value',
  //     render: (value: string) => <span className="font-mono font-semibold" data-testid={`text-program-${value}`}>{value}</span>
  //   },
  //   {
  //     key: 'totalPaid',
  //     header: 'Cash Collected',
  //     render: (value: string) => <span className="font-mono font-semibold" data-testid={`text-cashCollected-${value}`}>{value}</span>
  //   },
  //   {
  //     key: 'csm',
  //     header: 'CSM',
  //     render: (value: string) => <span data-testid={`text-csm-${value}`}>{value}</span>
  //   },
  //   {
  //     key: 'selectedOutcome',
  //     header: 'Status',
  //     render: (value: string) => (
  //       <span className="text-sm text-orange-600 font-medium" data-testid={`text-status-${value}`}>{value}</span>
  //     )
  //   },
  //   {
  //     key: 'actions',
  //     header: 'Actions',
  //     render: (_value: any, row: any) => (
  //       <Button
  //         size="sm"
  //         variant="outline"
  //         onClick={() => {
  //           setSelectedStudent({
  //             id: row.id,
  //             name: row.name,
  //             email: row.email,
  //             startDate: row.lastCheckIn || new Date(),
  //             endDate: null,
  //             csm: row.csm,
  //             cashCollected: row.totalPaid ? parseInt(row.totalPaid.replace(/[$,]/g, '')) : 0,
  //             contractedValue: row.program ? parseInt(row.program.replace(/[$,]/g, '')) : 0,
  //             program_price: row.program ? parseInt(row.program.replace(/[$,]/g, '')) : 0,
  //             total_paid: row.totalPaid ? parseInt(row.totalPaid.replace(/[$,]/g, '')) : 0,
  //             plan_type: row.planType || 'PIF',
  //             installments: row.installments || undefined,
  //             referral_name: row.referralName || '',
  //             products: row.products || [],
  //             status: 'active',
  //           });
  //           setModalOpen(true);
  //         }}
  //         data-testid={`button-view-student-${row.email}`}
  //       >
  //         <Eye className="w-4 h-4 mr-2" />
  //         View Student
  //       </Button>
  //     )
  //   },
  // ];

  // Active clients table columns
  const activeClientsColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (value: string) => <span className="font-medium" data-testid={`text-name-${value}`}>{value}</span>
    },
    {
      key: 'email',
      header: 'Email',
      render: (value: string) => <span className="text-muted-foreground" data-testid={`text-email-${value}`}>{value}</span>
    },
    {
      key: 'program',
      header: 'Program',
      render: (value: string) => <span className="font-mono font-semibold" data-testid={`text-program-${value}`}>{value}</span>
    },
    {
      key: 'csm',
      header: 'CSM',
      render: (value: string, row: any) => {
        const csmMembers = csmMembersData?.members || [];
        return (
          <Select
            value={value || 'Unassigned'}
            onValueChange={(newValue) => {
              const csmFirstName = newValue === 'Unassigned' ? null : newValue;
              assignCsmMutation.mutate({
                studentEmail: row.email,
                csmFirstName,
              });
            }}
            disabled={assignCsmMutation.isPending}
          >
            <SelectTrigger className="w-[180px]" data-testid={`select-csm-${row.email}`}>
              <SelectValue placeholder="Select CSM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unassigned" data-testid="select-csm-unassigned">
                Unassigned
              </SelectItem>
              {csmMembers.map((member: any) => (
                <SelectItem
                  key={member.id}
                  value={member.name}
                  data-testid={`select-csm-${member.name}`}
                >
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (value: Date) => <span data-testid={`text-startdate-${value}`}>{new Date(value).toLocaleDateString()}</span>
    },
    {
      key: 'cashCollected',
      header: 'CC',
      render: (value: number) => (
        <span className="font-mono text-green-600 font-semibold" data-testid={`text-cc-${value}`}>
          ${value.toLocaleString()}
        </span>
      )
    },
    {
      key: 'contractedValue',
      header: 'Contracted Value',
      render: (value: number) => (
        <span className="font-mono font-semibold" data-testid={`text-contracted-${value}`}>
          ${value.toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_value: any, row: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedStudent({
              id: row.id || 1,
              name: row.name,
              email: row.email,
              startDate: row.startDate,
              endDate: row.endDate || null,
              csm: row.csm,
              cashCollected: row.cashCollected,
              contractedValue: row.contractedValue,
              program_price: row.contractedValue,
              total_paid: row.cashCollected,
              plan_type: row.planType || 'PIF',
              installments: row.installments || undefined,
              referral_name: row.referralName || '',
              products: row.products || [],
              status: 'active',
            });
            setModalOpen(true);
          }}
          data-testid={`button-view-student-${row.email}`}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Student
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-semibold" data-testid="text-page-title">
          Client Success Management
        </h2>
        <DateRangePicker
          onRangeChange={(from, to) => setDateRange({ from, to })}
        />
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* High-Risk Clients Alert */}
      { /* highRiskData && highRiskData.clients && highRiskData.clients.length > 0 && (
        <Card className="p-6 border-l-4 border-l-orange-500 shadow-soft" data-testid="card-high-risk-alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-orange-600" data-testid="text-alert-title">
                High-Risk Clients Alert
              </h3>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-alert-message">
                {highRiskData.clients.length} client{highRiskData.clients.length !== 1 ? 's' : ''} flagged as high-risk based on their check-in responses.
              </p>
            </div>
          </div>
        </Card>
      )*/}

      {/* High-Risk Clients Table
      <div>
        <h3 className="text-lg font-semibold mb-4" data-testid="text-section-high-risk">
          High-Risk Clients
        </h3>
        {highRiskLoading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        ) : (
          <DataTable
            columns={highRiskColumns}
            data={highRiskData?.clients || []}
          />
        )}
      </div> */}

      {/* Active Clients Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold" data-testid="text-section-active-clients">
            Active Clients
          </h3>
        </div>
        {activeClientsLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md">
            <DataTable
              columns={activeClientsColumns}
              data={activeClientsData?.clients || []}
            />
          </div>
        )}
      </Card>

      <StudentModal
        student={selectedStudent}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
}
