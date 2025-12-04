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
  variant?: 'default' | 'gradient-primary' | 'gradient-accent' | 'gradient-cyan' | 'gradient-pink';
}

export default function KpiCard({ title, value, icon: Icon, iconColor, trend, loading = false, variant = 'default' }: KpiCardProps) {
  const isGradient = variant !== 'default';

  const getGradientClass = () => {
    switch (variant) {
      case 'gradient-primary': return 'bg-gradient-primary';
      case 'gradient-accent': return 'bg-gradient-accent';
      case 'gradient-cyan': return 'bg-gradient-cyan';
      case 'gradient-pink': return 'bg-gradient-pink';
      default: return 'bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60';
    }
  };

  return (
    <Card className={`
      relative overflow-hidden border-0 shadow-lg transition-all duration-300 group hover:-translate-y-1
      ${getGradientClass()}
      ${isGradient ? 'text-white shadow-2xl shadow-primary/10' : 'text-foreground'}
    `}>
      {/* Background decorative elements for default cards */}
      {!isGradient && (
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
      )}

      <div className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`
            p-3 rounded-xl 
            ${isGradient ? 'bg-white/20 backdrop-blur-sm' : 'bg-primary/10'}
          `}>
            {Icon && <Icon className={`w-6 h-6 ${isGradient ? 'text-white' : 'text-primary'}`} />}
          </div>
          {trend && (
            <div className={`
               flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
               ${trend.isPositive
                ? (isGradient ? 'bg-white/20 text-white' : 'bg-green-500/10 text-green-500')
                : (isGradient ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-500')
              }
             `}>
              {trend.isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className={`text-sm font-medium ${isGradient ? 'text-white/80' : 'text-muted-foreground'}`}>
            {title}
          </h3>
          {loading ? (
            <div className="h-8 w-24 bg-white/10 animate-pulse rounded" />
          ) : (
            <div className="text-3xl font-bold tracking-tight font-sans">
              {value}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
