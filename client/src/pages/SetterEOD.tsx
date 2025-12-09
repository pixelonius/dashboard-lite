
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

export default function SetterEOD() {
    const { toast } = useToast();
    const [date, setDate] = useState<Date>(new Date());
    const [setterId, setSetterId] = useState<string>("");
    const [callsMade, setCallsMade] = useState("");
    const [liveCalls, setLiveCalls] = useState("");
    const [bookedCalls, setBookedCalls] = useState("");
    const [reschedules, setReschedules] = useState("");
    const [unqualifiedLeads, setUnqualifiedLeads] = useState("");
    const [notes, setNotes] = useState("");

    const { data: setters, isLoading: isLoadingSetters } = useQuery({
        queryKey: ["/api/public/setters"],
        queryFn: async () => {
            const res = await fetch("/api/public/setters");
            if (!res.ok) throw new Error("Failed to fetch setters");
            const data = await res.json();
            return data.members;
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/sales/setter-eod", data);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "EOD Report submitted successfully",
            });
            // Reset form
            setCallsMade("");
            setLiveCalls("");
            setBookedCalls("");
            setReschedules("");
            setUnqualifiedLeads("");
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
        if (!setterId) {
            toast({
                title: "Error",
                description: "Please select a setter",
                variant: "destructive",
            });
            return;
        }

        mutation.mutate({
            setterId: parseInt(setterId),
            date: format(date, "yyyy-MM-dd"),
            callsMade: parseInt(callsMade) || 0,
            liveCalls: parseInt(liveCalls) || 0,
            bookedCalls: parseInt(bookedCalls) || 0,
            reschedules: parseInt(reschedules) || 0,
            unqualifiedLeads: parseInt(unqualifiedLeads) || 0,
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
                        Setter EOD Report
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Setter Selection */}
                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Setter</Label>
                                <Select value={setterId} onValueChange={setSetterId}>
                                    <SelectTrigger className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30">
                                        <SelectValue placeholder={isLoadingSetters ? "Loading..." : "Select Setter"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {setters?.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
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
                                <Label className="group-hover:text-primary transition-colors">Calls Made</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={callsMade}
                                    onChange={(e) => setCallsMade(e.target.value)}
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
                                <Label className="group-hover:text-primary transition-colors">Booked Calls</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={bookedCalls}
                                    onChange={(e) => setBookedCalls(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2 group">
                                <Label className="group-hover:text-primary transition-colors">Reschedules</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={reschedules}
                                    onChange={(e) => setReschedules(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 group">
                                <Label className="group-hover:text-primary transition-colors">Unqualified Leads</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={unqualifiedLeads}
                                    onChange={(e) => setUnqualifiedLeads(e.target.value)}
                                    className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30 focus:scale-[1.02]"
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Text Areas */}
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
