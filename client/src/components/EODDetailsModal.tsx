import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EODDetailsModalProps {
    report: any;
    isOpen: boolean;
    onClose: () => void;
    role: "CLOSER" | "SETTER" | "DM_SETTER";
}

export default function EODDetailsModal({ report, isOpen, onClose, role }: EODDetailsModalProps) {
    if (!report) return null;

    const renderField = (label: string, value: any) => (
        <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">{label}</h4>
            <p className="text-base">{value ?? "-"}</p>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>EOD Report Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[80vh] pr-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {renderField("Date", report.date)}
                            {renderField("Team Member", report.name)}
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-lg font-semibold mb-4">Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {role === "CLOSER" && (
                                    <>
                                        {renderField("Scheduled Calls", report.scheduledCalls)}
                                        {renderField("Live Calls", report.liveCalls)}
                                        {renderField("Offers Made", report.offersMade)}
                                        {renderField("Closes", report.closes)}
                                        {renderField("Cash Collected", `$${report.cashCollected?.toLocaleString()}`)}
                                    </>
                                )}
                                {role === "SETTER" && (
                                    <>
                                        {renderField("Calls Made", report.callsMade)}
                                        {renderField("Live Calls", report.liveCalls)}
                                        {renderField("Booked Calls", report.bookedCalls)}
                                        {renderField("Reschedules", report.reschedules)}
                                        {renderField("Unqualified Leads", report.unqualifiedLeads)}
                                    </>
                                )}
                                {role === "DM_SETTER" && (
                                    <>
                                        {renderField("DMs Sent", report.dmsSent)}
                                        {renderField("Conversations Started", report.conversationsStarted)}
                                        {renderField("Booked Calls", report.bookedCalls)}
                                        {renderField("Reschedules", report.reschedules)}
                                        {renderField("Unqualified Leads", report.unqualifiedLeads)}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-lg font-semibold mb-4">Qualitative</h3>
                            {renderField("Struggles", report.struggles)}
                            {renderField("Notes", report.notes)}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
