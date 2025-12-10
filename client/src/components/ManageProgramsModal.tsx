import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ManageProgramsModalProps {
    trigger?: React.ReactNode;
}

export default function ManageProgramsModal({ trigger }: ManageProgramsModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<any>(null);
    const [name, setName] = useState("");

    const { data: programs, isLoading } = useQuery({
        queryKey: ["/api/programs"],
        queryFn: async () => {
            const res = await fetch("/api/programs"); // Helper is authed
            if (!res.ok) throw new Error("Failed to fetch programs");
            const data = await res.json();
            return data.programs;
        },
        enabled: isOpen,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/programs", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
            queryClient.invalidateQueries({ queryKey: ["/api/v1/products"] });
            queryClient.invalidateQueries({ queryKey: ["/api/public/programs"] }); // Update new public list
            toast({ title: "Success", description: "Program added successfully" });
            setName("");
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("PATCH", `/api/programs/${data.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
            queryClient.invalidateQueries({ queryKey: ["/api/v1/products"] });
            queryClient.invalidateQueries({ queryKey: ["/api/public/programs"] });
            toast({ title: "Success", description: "Program updated successfully" });
            setEditingProgram(null);
            setName("");
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/programs/${id}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
            queryClient.invalidateQueries({ queryKey: ["/api/v1/products"] });
            queryClient.invalidateQueries({ queryKey: ["/api/public/programs"] });
            toast({ title: "Success", description: "Program removed successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProgram) {
            updateMutation.mutate({ id: editingProgram.id, name });
        } else {
            createMutation.mutate({ name });
        }
    };

    const startEdit = (program: any) => {
        setEditingProgram(program);
        setName(program.name);
    };

    const cancelEdit = () => {
        setEditingProgram(null);
        setName("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Manage Programs</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>Manage Programs</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add/Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Program Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Sales Mastery"
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingProgram && (
                                <Button type="button" variant="ghost" onClick={cancelEdit} size="sm">
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : editingProgram ? (
                                    "Update Program"
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Program
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Programs List */}
                    <div className="space-y-2">
                        <Label>Current Programs</Label>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : programs?.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No programs found.</p>
                            ) : (
                                programs?.map((program: any) => (
                                    <div
                                        key={program.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <span className="font-medium">{program.name}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:text-primary"
                                                onClick={() => startEdit(program)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Remove Program?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove {program.name} from the active list. Historical data is preserved.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteMutation.mutate(program.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Remove
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
