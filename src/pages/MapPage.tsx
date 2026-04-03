import { useComplaints } from '@/contexts/ComplaintContext';
import Navbar from '@/components/Navbar';
import EmergencyButton from '@/components/EmergencyButton';
import MapView from '@/components/MapView';

export default function MapPage() {
  const { complaints } = useComplaints();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <h1 className="font-heading text-2xl font-bold mb-4 text-foreground">Issue Map</h1>
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="w-3 h-3 rounded-full bg-pending inline-block" /> Pending
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="w-3 h-3 rounded-full bg-in-progress inline-block" /> In Progress
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="w-3 h-3 rounded-full bg-resolved inline-block" /> Resolved
          </div>
        </div>
        <MapView complaints={complaints} height="calc(100vh - 200px)" />
      </div>
      <EmergencyButton />
    </div>
  );
}
