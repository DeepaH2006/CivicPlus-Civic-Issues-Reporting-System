import type { Status, Priority } from '@/data/store';

export function StatusBadge({ status }: { status: Status }) {
  const cls = status === 'Pending' ? 'status-badge-pending' : status === 'In Progress' ? 'status-badge-in-progress' : 'status-badge-resolved';
  return <span className={`${cls} text-xs font-semibold px-2.5 py-1 rounded-full`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return priority === 'High'
    ? <span className="bg-destructive/10 text-destructive text-xs font-semibold px-2.5 py-1 rounded-full">🔴 High</span>
    : <span className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded-full">Normal</span>;
}
