import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
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

interface ManageTeamModalProps {
    role: "CLOSER" | "SETTER" | "DM_SETTER";
    trigger?: React.ReactNode;
}

export default function ManageTeamModal({ role, trigger }: ManageTeamModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const roleLabel = role === "DM_SETTER" ? "DM Setter" : role.charAt(0) + role.slice(1).toLowerCase();

    const { data: members, isLoading } = useQuery({
        queryKey: ["/api/team-members", role],
        queryFn: async () => {
            const res = await fetch(`/api/team-members?role=${role}`);
            if (!res.ok) throw new Error("Failed to fetch members");
            const data = await res.json();
            return data.members;
        },
        enabled: isOpen,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/team-members", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            toast({ title: "Success", description: "Team member added successfully" });
            setFirstName("");
            setLastName("");
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("PATCH", `/api/team-members/${data.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            toast({ title: "Success", description: "Team member updated successfully" });
            setEditingMember(null);
            setFirstName("");
            setLastName("");
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/team-members/${id}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            toast({ title: "Success", description: "Team member removed successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            updateMutation.mutate({ id: editingMember.id, firstName, lastName, role });
        } else {
            createMutation.mutate({ firstName, lastName, role });
        }
    };

    const startEdit = (member: any) => {
        setEditingMember(member);
        const [first, ...last] = member.name.split(" ");
        setFirstName(first);
        setLastName(last.join(" "));
    };

    const cancelEdit = () => {
        setEditingMember(null);
        setFirstName("");
        setLastName("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Manage {roleLabel}s</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>Manage {roleLabel}s</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add/Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingMember && (
                                <Button type="button" variant="ghost" onClick={cancelEdit} size="sm">
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : editingMember ? (
                                    "Update Member"
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Member
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Members List */}
                    <div className="space-y-2">
                        <Label>Current Team Members</Label>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : members?.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No team members found.</p>
                            ) : (
                                members?.map((member: any) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <span className="font-medium">{member.name}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:text-primary"
                                                onClick={() => startEdit(member)}
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
                                                        <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove {member.name} from the active list. Their historical data will be preserved.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteMutation.mutate(member.id)}
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
