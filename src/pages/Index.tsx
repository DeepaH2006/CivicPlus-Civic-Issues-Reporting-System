import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, MapPin, BarChart3, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const routes = { Citizen: '/dashboard', Admin: '/admin', 'Field Staff': '/staff' };
      navigate(routes[user.role]);
    }
  }, [isAuthenticated, user, navigate]);

  const features = [
    { icon: MapPin, title: 'GPS Location', desc: 'Auto-detect & map your issue location' },
    { icon: BarChart3, title: 'Real-time Tracking', desc: 'Track complaint status live' },
    { icon: Users, title: 'Auto Routing', desc: 'Issues auto-assigned to departments' },
    { icon: AlertTriangle, title: 'Emergency', desc: 'Quick access to emergency services' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-accent p-4 rounded-2xl shadow-lg">
              <Shield className="h-10 w-10 text-accent-foreground" />
            </div>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 leading-tight">
            CivicPulse
          </h1>
          <p className="text-lg md:text-xl opacity-80 max-w-lg mx-auto mb-8">
            Report civic issues. Track resolutions. Build better communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Demo credentials */}
          <div className="mt-8 bg-primary-foreground/10 backdrop-blur rounded-xl p-4 max-w-md mx-auto text-left">
            <p className="text-xs font-semibold mb-2 opacity-80">Demo Accounts:</p>
            <div className="space-y-1 text-xs opacity-70">
              <p>👤 Citizen: ravi@gmail.com / password123</p>
              <p>🏢 Admin: admin@gmail.com / admin123</p>
              <p>👷 Staff: staff@gmail.com / staff123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="font-heading text-2xl font-bold text-center mb-10 text-foreground">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-card rounded-xl border p-6 text-center card-hover">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>CivicPulse — Crowdsourced Civic Issue Reporting System</p>
      </footer>
    </div>
  );
}
