import { Badge } from "@/components/ui/badge";

type StatusVariant = "success" | "warning" | "error" | "info" | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`${variantStyles[variant]} font-medium`}>
      {status}
    </Badge>
  );
}
