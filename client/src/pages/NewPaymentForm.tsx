import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema matching the backend validation
const paymentFormSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    programId: z.string().min(1, "Program is required"), // Select returns string
    planType: z.enum(['PIF', 'SPLIT']),
    startDate: z.date({ required_error: "Start date is required" }),
    // PIF field
    totalValue: z.string().min(1, "Value is required").optional(), // String input for numbers
    // Split fields
    numberOfInstallments: z.string().optional(), // Drodown 1-5
    installments: z.array(z.object({
        amount: z.string().min(1, "Amount is required"),
        dueDate: z.date({ required_error: "Due date is required" }),
    })).optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function NewPaymentForm() {
    const { toast } = useToast();
    const [submitted, setSubmitted] = useState(false);

    // Fetch products (publicly or reuse authenticated if token present? Request implied public form)
    // Assuming the user is logged in OR we made the products endpoint public?
    // Implementation plan noted: "Fetch from /api/v1/products ... check if public".
    // `server/routes.ts` shows `/api/v1/products` requires auth.
    // However, the user said "The button to copy the link to this form will be in the Settings section", 
    // implying this form might be used by staff (who are logged in) OR sent to leads (who aren't).
    // "New Payment Form that allows users (likely staff) to input payment details." 
    // If it's for staff, they are logged in. I'll assume auth is available for now. 
    // If NOT, I will need to make a public products endpoint.
    // Let's assume logged in for now, as most CRM forms are internal. 
    // If it fails on load, I'll know.

    // Fetch products (publicly)
    // The previous endpoint returned { products: [...] }, the new one returns { programs: [...] }
    const { data: programs, isLoading: programsLoading } = useQuery<any>({
        queryKey: ["/api/public/programs"],
        queryFn: async () => {
            const res = await fetch("/api/public/programs");
            if (!res.ok) throw new Error("Failed to fetch programs");
            const data = await res.json();
            return data.programs;
        },
    });

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            planType: "PIF",
            startDate: new Date(),
            installments: [],
        },
    });

    const planType = form.watch("planType");
    const numberOfInstallments = form.watch("numberOfInstallments");

    // Dynamic fields for installments
    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "installments",
    });

    // Effect to update installment fields when number changes
    useEffect(() => {
        if (planType === 'SPLIT' && numberOfInstallments) {
            const count = parseInt(numberOfInstallments);
            const currentFields = form.getValues().installments || [];
            const newFields = Array(count).fill(null).map((_, index) => {
                // Preserve existing values if expanding
                return currentFields[index] || { amount: "", dueDate: new Date() };
            });
            replace(newFields);
        }
    }, [numberOfInstallments, planType, replace, form]);

    const mutation = useMutation({
        mutationFn: async (values: PaymentFormValues) => {
            // Transform data for backend
            const payload: any = {
                fullName: values.fullName,
                email: values.email,
                phone: values.phone,
                programId: parseInt(values.programId),
                planType: values.planType,
                startDate: values.startDate.toISOString().split('T')[0],
            };

            if (values.planType === 'PIF') {
                payload.totalValue = parseFloat(values.totalValue || "0");
            } else {
                // Calculate total value from installments
                const installments = values.installments?.map(inst => ({
                    amount: parseFloat(inst.amount),
                    dueDate: inst.dueDate.toISOString().split('T')[0],
                })) || [];

                payload.installments = installments;
                payload.totalValue = installments.reduce((sum, inst) => sum + inst.amount, 0);
            }

            const res = await apiRequest("POST", "/api/sales/new-payment", payload);
            return res.json();
        },
        onSuccess: () => {
            setSubmitted(true);
            toast({
                title: "Success",
                description: "Payment and enrollment created successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create payment.",
                variant: "destructive",
            });
        },
    });

    function onSubmit(data: PaymentFormValues) {
        mutation.mutate(data);
    }

    if (submitted) {
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

                <Card className="max-w-md w-full relative z-10 border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Success!</h2>
                        <p className="text-muted-foreground">The student has been enrolled and payment recorded.</p>
                        <Button onClick={() => {
                            setSubmitted(false);
                            form.reset({ planType: "PIF", startDate: new Date(), installments: [] });
                        }} variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">
                            Record Another Payment
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

            <div className="max-w-2xl w-full relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        New Payment Form
                    </h1>
                    <p className="mt-2 text-muted-foreground">Enter payment details to enroll a new student.</p>
                </div>

                <Card className="border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl hover:shadow-primary/5 transition-shadow">
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* Personal Info */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" type="email" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+1 234 567 8900" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="h-px bg-white/10 my-6" />

                                {/* Program & Plan */}
                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="programId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Program</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white/5 border-white/10 transition-all hover:bg-white/10 hover:border-primary/30">
                                                            <SelectValue placeholder={programsLoading ? "Loading..." : "Select a program"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {programs?.map((p: any) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="planType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payment Plan</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select plan type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PIF">Pay In Full (PIF)</SelectItem>
                                                        <SelectItem value="SPLIT">Payment Plan (Split)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Conditional Fields */}
                                {planType === 'PIF' ? (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="totalValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Total Value</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                                            <Input className="pl-7" type="number" placeholder="0.00" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="mb-2.5">Start Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(field.value, "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) =>
                                                                    date < new Date("1900-01-01")
                                                                }
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="numberOfInstallments"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of Installments</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select number of installments" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {[1, 2, 3, 4, 5].map(num => (
                                                                <SelectItem key={num} value={num.toString()}>
                                                                    {num} Installment{num > 1 ? 's' : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 bg-white/5 rounded-lg border border-white/10">
                                                <div className="text-sm font-medium text-white sm:col-span-2">
                                                    Installment #{index + 1} {index === 0 && "(Due Now)"}
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name={`installments.${index}.amount`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Amount</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                                                    <Input className="pl-7" type="number" placeholder="0.00" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`installments.${index}.dueDate`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className="mb-2.5">Due Date</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant={"outline"}
                                                                            className={cn(
                                                                                "w-full pl-3 text-left font-normal",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {field.value ? (
                                                                                format(field.value, "PPP")
                                                                            ) : (
                                                                                <span>Pick a date</span>
                                                                            )}
                                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={field.value}
                                                                        onSelect={field.onChange}
                                                                        disabled={(date) =>
                                                                            date < new Date("1900-01-01")
                                                                        }
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={mutation.isPending || programsLoading}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {mutation.isPending ? "Processing..." : "Submit Payment Record"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
