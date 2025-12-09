
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CloserEOD() {
    const { toast } = useToast();
    const [date, setDate] = useState<Date>(new Date());
    const [closerId, setCloserId] = useState<string>("");
    const [scheduledCalls, setScheduledCalls] = useState("");
    const [liveCalls, setLiveCalls] = useState("");
    const [offersMade, setOffersMade] = useState("");
    const [closes, setCloses] = useState("");
    const [cashCollected, setCashCollected] = useState("");
    const [struggles, setStruggles] = useState("");
    const [notes, setNotes] = useState("");

    const { data: closers, isLoading: isLoadingClosers } = useQuery({
        queryKey: ["/api/public/closers"],
        queryFn: async () => {
            const res = await fetch("/api/public/closers");
            if (!res.ok) throw new Error("Failed to fetch closers");
            const data = await res.json();
            return data.members;
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/sales/closer-eod", data);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "EOD Report submitted successfully",
            });
            // Reset form
            setScheduledCalls("");
            setLiveCalls("");
            setOffersMade("");
            setCloses("");
            setCashCollected("");
            setStruggles("");
            setNotes("");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to submit report",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!closerId) {
            toast({
                title: "Error",
                description: "Please select a closer",
                variant: "destructive",
            });
            return;
        }

        mutation.mutate({
            closerId: parseInt(closerId),
            date: format(date, "yyyy-MM-dd"),
            scheduledCalls: parseInt(scheduledCalls) || 0,
            liveCalls: parseInt(liveCalls) || 0,
            offersMade: parseInt(offersMade) || 0,
            closes: parseInt(closes) || 0,
            cashCollected: parseFloat(cashCollected) || 0,
            struggles,
            notes,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Checkered Background */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Background Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[128px] animate-pulse delay-1000" />

            <Card className="w-full max-w-2xl relative z-10 border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500 hover:shadow-primary/5 transition-shadow">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tight">
                        Closer EOD Report
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Closer Selection */}
                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Closer</Label>
                                <Select value={closerId} onValueChange={setCloserId}>
                                    <SelectTrigger className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30">
                                        <SelectValue placeholder={isLoadingClosers ? "Loading..." : "Select Closer"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {closers?.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Date of Reporting</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Scheduled Calls</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={scheduledCalls}
                                    onChange={(e) => setScheduledCalls(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Live Calls</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={liveCalls}
                                    onChange={(e) => setLiveCalls(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Offers Made</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={offersMade}
                                    onChange={(e) => setOffersMade(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Closes</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={closes}
                                    onChange={(e) => setCloses(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 group">
                                <Label className="group-hover:text-primary transition-colors">Cash Collected ($)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={cashCollected}
                                    onChange={(e) => setCashCollected(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Text Areas */}
                        <div className="space-y-2 group">
                            <Label className="group-hover:text-primary transition-colors">Things you struggled with today</Label>
                            <Textarea
                                value={struggles}
                                onChange={(e) => setStruggles(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-[100px] transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.01]"
                                placeholder="Describe any challenges..."
                            />
                        </div>

                        <div className="space-y-2 group">
                            <Label className="group-hover:text-primary transition-colors">Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-[100px] transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.01]"
                                placeholder="Any additional notes..."
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Submit Report
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
