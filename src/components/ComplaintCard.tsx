import { Complaint } from '@/data/store';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { MapPin, Clock, Building2 } from 'lucide-react';

export default function ComplaintCard({ complaint, onClick }: { complaint: Complaint; onClick?: () => void }) {
  return (
    <div
      className="bg-card rounded-xl border shadow-sm card-hover cursor-pointer p-4"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {complaint.imageUrl && (
          <img src={complaint.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-muted-foreground">{complaint.id}</span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <p className="text-sm font-medium text-foreground truncate">{complaint.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{complaint.category}</span>
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{complaint.department}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
