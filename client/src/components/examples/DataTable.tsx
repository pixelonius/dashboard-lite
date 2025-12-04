import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';

export default function DataTableExample() {
  //todo: remove mock functionality
  const mockData = [
    { id: 'ORD-001', customer: 'John Smith', product: 'High-Ticket Course', amount: '$4,999', status: 'Paid', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Sarah Johnson', product: 'Deposit', amount: '$500', status: 'Pending', date: '2024-01-16' },
    { id: 'ORD-003', customer: 'Mike Davis', product: 'Subscription', amount: '$99', status: 'Paid', date: '2024-01-17' },
    { id: 'ORD-004', customer: 'Emily Brown', product: 'High-Ticket Course', amount: '$4,999', status: 'Overdue', date: '2024-01-18' },
    { id: 'ORD-005', customer: 'David Wilson', product: 'Deposit', amount: '$500', status: 'Paid', date: '2024-01-19' },
    { id: 'ORD-006', customer: 'Lisa Anderson', product: 'High-Ticket Course', amount: '$4,999', status: 'Paid', date: '2024-01-20' },
    { id: 'ORD-007', customer: 'Tom Martinez', product: 'Subscription', amount: '$99', status: 'Pending', date: '2024-01-21' },
    { id: 'ORD-008', customer: 'Amy Taylor', product: 'High-Ticket Course', amount: '$4,999', status: 'Paid', date: '2024-01-22' },
    { id: 'ORD-009', customer: 'Chris Lee', product: 'Deposit', amount: '$500', status: 'Overdue', date: '2024-01-23' },
    { id: 'ORD-010', customer: 'Jessica White', product: 'High-Ticket Course', amount: '$4,999', status: 'Paid', date: '2024-01-24' },
    { id: 'ORD-011', customer: 'Ryan Clark', product: 'Subscription', amount: '$99', status: 'Paid', date: '2024-01-25' },
    { id: 'ORD-012', customer: 'Michelle Hall', product: 'High-Ticket Course', amount: '$4,999', status: 'Pending', date: '2024-01-26' },
  ];

  const columns = [
    { key: 'id', header: 'Order ID' },
    { key: 'customer', header: 'Customer' },
    { key: 'product', header: 'Product' },
    { key: 'amount', header: 'Amount', render: (value: string) => <span className="font-mono font-semibold">{value}</span> },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => {
        const variant = value === 'Paid' ? 'success' : value === 'Overdue' ? 'error' : 'warning';
        return <StatusBadge status={value} variant={variant} />;
      }
    },
    { key: 'date', header: 'Date' },
  ];

  return (
    <div className="p-8 bg-background">
      <DataTable columns={columns} data={mockData} pageSize={8} />
    </div>
  );
}
