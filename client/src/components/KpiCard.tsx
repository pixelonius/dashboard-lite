import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export default function KpiCard({ title, value, icon: Icon, iconColor, trend, loading = false }: KpiCardProps) {
  return (
    <Card className="p-6 shadow-soft border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold tracking-tight font-mono transition-all duration-300 group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
              {value}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.isPositive ? (
                <ArrowUp className="w-3 h-3 text-green-600" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColor ? iconColor.replace('text-', 'bg-').replace('500', '100') : 'bg-primary/10'}`}>
            <Icon className={`w-5 h-5 ${iconColor || 'text-primary'}`} />
          </div>
        )}
      </div>
    </Card>
  );
}
