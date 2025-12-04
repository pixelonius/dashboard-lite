import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="p-8 bg-background">
      <div className="flex flex-wrap gap-3">
        <StatusBadge status="Active" variant="success" />
        <StatusBadge status="Pending" variant="warning" />
        <StatusBadge status="Overdue" variant="error" />
        <StatusBadge status="Paid" variant="success" />
        <StatusBadge status="In Progress" variant="info" />
        <StatusBadge status="Completed" variant="default" />
      </div>
    </div>
  );
}
