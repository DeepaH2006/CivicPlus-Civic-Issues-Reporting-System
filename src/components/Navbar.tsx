import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const roleNavItems = {
  Citizen: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Report Issue", path: "/report" },
    { label: "Map", path: "/map" },
  ],
  Admin: [
    { label: "Dashboard", path: "/admin" },
    { label: "Map", path: "/map" },
    { label: "Analytics", path: "/analytics" },
  ],
  "Field Staff": [
    { label: "My Tasks", path: "/staff" },
    { label: "Map", path: "/map" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = roleNavItems[user.role];

  return (
    <nav className="gradient-primary sticky top-0 z-50 text-primary-foreground shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
        >
          <img
            src="/logo.png"
            alt="CivicPulse Logo"
            className="h-8 w-8 rounded-md object-contain"
          />
          <span className="hidden sm:inline">CivicPulse</span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-sm">
            <span className="opacity-70">Hi,</span>{" "}
            <span className="font-semibold">{user.name}</span>
            <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
              {user.role}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-primary-foreground/20 pb-4 md:hidden">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`block w-full px-6 py-3 text-left text-sm font-medium ${
                location.pathname === item.path ? "bg-primary-foreground/20" : ""
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="mt-2 border-t border-primary-foreground/20 px-6 pt-3">
            <p className="mb-2 text-sm opacity-70">
              {user.name} ({user.role})
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
                setMobileOpen(false);
              }}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}