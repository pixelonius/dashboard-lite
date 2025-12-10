import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateRangePicker from "@/components/DateRangePicker";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";
import ManageTeamModal from "@/components/ManageTeamModal";
import EODDetailsModal from "@/components/EODDetailsModal";

export default function EODReports() {
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [activeTab, setActiveTab] = useState<"CLOSER" | "SETTER" | "DM_SETTER">("CLOSER");
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data: reports, isLoading } = useQuery({
        queryKey: ["/api/reports/eod", activeTab, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                from: format(dateRange.from, "yyyy-MM-dd"),
                to: format(dateRange.to, "yyyy-MM-dd"),
                role: activeTab,
            });
            const res = await fetch(`/api/reports/eod?${params}`);
            if (!res.ok) throw new Error("Failed to fetch reports");
            const data = await res.json();
            return data.reports;
        },
    });

    const copyFormLink = () => {
        const baseUrl = window.location.origin;
        let path = "";
        switch (activeTab) {
            case "CLOSER": path = "/closer-eod"; break;
            case "SETTER": path = "/setter-eod"; break;
            case "DM_SETTER": path = "/dmsetter-eod"; break;
        }
        navigator.clipboard.writeText(`${baseUrl}${path}`);
        toast({
            title: "Link Copied",
            description: "EOD Form link copied to clipboard",
        });
    };

    const handleRowClick = (report: any) => {
        setSelectedReport(report);
        setIsDetailsOpen(true);
    };

    const renderTableHeaders = () => {
        switch (activeTab) {
            case "CLOSER":
                return (
                    <>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Scheduled</TableHead>
                        <TableHead className="text-right">Live</TableHead>
                        <TableHead className="text-right">Offers</TableHead>
                        <TableHead className="text-right">Closes</TableHead>
                        <TableHead className="text-right">Cash</TableHead>
                    </>
                );
            case "SETTER":
                return (
                    <>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Dials</TableHead>
                        <TableHead className="text-right">Pickups</TableHead>
                        <TableHead className="text-right">Booked</TableHead>
                        <TableHead className="text-right">Reschedules</TableHead>
                    </>
                );
            case "DM_SETTER":
                return (
                    <>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">DMs Sent</TableHead>
                        <TableHead className="text-right">Convos</TableHead>
                        <TableHead className="text-right">Booked</TableHead>
                    </>
                );
        }
    };

    const renderRowCells = (row: any) => {
        switch (activeTab) {
            case "CLOSER":
                return (
                    <>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.scheduledCalls}</TableCell>
                        <TableCell className="text-right">{row.liveCalls}</TableCell>
                        <TableCell className="text-right">{row.offersMade}</TableCell>
                        <TableCell className="text-right">{row.closes}</TableCell>
                        <TableCell className="text-right">${row.cashCollected.toLocaleString()}</TableCell>
                    </>
                );
            case "SETTER":
                return (
                    <>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.callsMade}</TableCell>
                        <TableCell className="text-right">{row.liveCalls}</TableCell>
                        <TableCell className="text-right">{row.bookedCalls}</TableCell>
                        <TableCell className="text-right">{row.reschedules}</TableCell>
                    </>
                );
            case "DM_SETTER":
                return (
                    <>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.dmsSent}</TableCell>
                        <TableCell className="text-right">{row.conversationsStarted}</TableCell>
                        <TableCell className="text-right">{row.bookedCalls}</TableCell>
                    </>
                );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        EOD Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View daily submissions and manage your team
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        onRangeChange={(from, to) => {
                            if (from && to) {
                                setDateRange({ from, to });
                            }
                        }}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="CLOSER">Closers</TabsTrigger>
                        <TabsTrigger value="SETTER">Setters</TabsTrigger>
                        <TabsTrigger value="DM_SETTER">DM Setters</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ManageTeamModal
                            role={activeTab}
                            trigger={
                                <Button variant="secondary" className="gap-2 flex-1 sm:flex-none">
                                    <Users className="h-4 w-4" />
                                    Manage {activeTab === "DM_SETTER" ? "DM Setters" : activeTab.charAt(0) + activeTab.slice(1).toLowerCase() + "s"}
                                </Button>
                            }
                        />
                        <Button variant="outline" onClick={copyFormLink} className="gap-2 flex-1 sm:flex-none">
                            <Copy className="h-4 w-4" />
                            Copy Link
                        </Button>
                    </div>
                </div>

                <Card className="border-white/10 bg-card/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium flex items-center justify-between">
                            <span>Submission History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-white/10">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-white/5 border-white/10">
                                        {renderTableHeaders()}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : reports?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No reports found for this period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reports?.map((row: any) => (
                                            <TableRow
                                                key={row.id}
                                                className="hover:bg-white/5 border-white/10 cursor-pointer transition-colors"
                                                onClick={() => handleRowClick(row)}
                                            >
                                                {renderRowCells(row)}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>

            <EODDetailsModal
                report={selectedReport}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                role={activeTab}
            />
        </div>
    );
}
