import KpiCard from '../KpiCard';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export default function KpiCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value="$128,450" 
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          iconColor="bg-primary"
        />
        <KpiCard 
          title="Orders Won" 
          value="342" 
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
          iconColor="bg-green-500"
        />
        <KpiCard 
          title="Active Customers" 
          value="1,284" 
          icon={Users}
          trend={{ value: 3.1, isPositive: false }}
          iconColor="bg-blue-500"
        />
        <KpiCard 
          title="Avg Order Value" 
          value="$375" 
          icon={TrendingUp}
          iconColor="bg-purple-500"
        />
      </div>
    </div>
  );
}
