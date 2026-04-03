import { useState } from 'react';
import { Phone, X, AlertTriangle } from 'lucide-react';

const EMERGENCY = [
  { label: 'Police', number: '100', icon: '🚔' },
  { label: 'Ambulance', number: '102', icon: '🚑' },
  { label: 'Fire', number: '101', icon: '🚒' },
];

export default function EmergencyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-destructive text-destructive-foreground rounded-full p-4 shadow-xl hover:scale-105 transition-transform"
        aria-label="Emergency"
      >
        <div className="absolute inset-0 rounded-full bg-destructive animate-pulse-ring" />
        <AlertTriangle className="h-6 w-6 relative z-10" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Emergency
              </h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {EMERGENCY.map(e => (
                <a
                  key={e.number}
                  href={`tel:${e.number}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <span className="text-2xl">{e.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{e.label}</p>
                    <p className="text-sm text-muted-foreground">Call {e.number}</p>
                  </div>
                  <Phone className="h-5 w-5 text-destructive" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
