/*import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Citizen" as Role,
  });

  const roleRedirect: Record<Role, string> = {
    Citizen: "/dashboard",
    Admin: "/admin",
    "Field Staff": "/staff",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignup) {
      const res = await signup(
        form.name,
        form.email,
        form.password,
        form.role
      );

      if (res.success) {
        toast.success("Account created successfully");
        navigate(roleRedirect[form.role]);
      } else {
        toast.error(res.error || "Signup failed");
      }
      return;
    }

    const res = await login(form.email, form.password);

    if (!res.success) {
      toast.error(res.error || "Login failed");
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem("civic_user") || "{}");

    if (savedUser.role === "Admin") {
      navigate("/admin");
    } else if (savedUser.role === "Field Staff") {
      navigate("/staff");
    } else {
      navigate("/dashboard");
    }
  };

  const quickLogins = [
    { label: "👤 Admin", email: "admin@gmail.com", password: "admin123" },
    { label: "👥 Citizen", email: "citizen@gmail.com", password: "123456" },
    { label: "💧 Water Staff", email: "water@gmail.com", password: "123456" },
    { label: "🗑️ Garbage Staff", email: "garbage@gmail.com", password: "123456" },
    { label: "🕳️ Road Staff", email: "road@gmail.com", password: "123456" },
    { label: "💡 Electrical Staff", email: "electrical@gmail.com", password: "123456" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="gradient-hero flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-accent p-3 rounded-xl">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>

            <h1 className="font-heading text-3xl font-bold text-primary-foreground">
              CivicPulse
            </h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">
              Crowdsourced Civic Issue Reporting
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-6">
            <div className="flex mb-6 bg-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  !isSignup
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSignup
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <Label className="text-foreground">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Your name"
                    required
                  />
                </div>
              )}

              <div>
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <Label className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div>
                  <Label className="text-foreground">Role</Label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as Role })
                    }
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="Citizen">Citizen</option>
                    <option value="Admin">Admin</option>
                    <option value="Field Staff">Field Staff</option>
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full">
                {isSignup ? "Create Account" : "Login"}
              </Button>
            </form>

            {!isSignup && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Quick Login
                </p>

                <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                  {quickLogins.map((s) => (
                    <button
                      key={s.email}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          email: s.email,
                          password: s.password,
                        }))
                      }
                      className="text-xs bg-secondary hover:bg-secondary/80 rounded-lg px-3 py-2 text-left transition-colors text-foreground"
                    >
                      <span className="font-medium">{s.label}</span> — {s.email}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}*/
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Citizen" as Role,
  });

  const roleRedirect: Record<Role, string> = {
    Citizen: "/dashboard",
    Admin: "/admin",
    "Field Staff": "/staff",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        const res = await signup(
          form.name,
          form.email,
          form.password,
          form.role
        );

        if (res.success) {
          toast.success("Account created successfully");
          navigate(roleRedirect[form.role]);
        } else {
          toast.error(res.error || "Signup failed");
        }
        return;
      }

      const res = await login(form.email, form.password);

      if (!res.success) {
        toast.error(res.error || "Login failed");
        return;
      }

      let savedUser: any = {};
      try {
        savedUser = JSON.parse(localStorage.getItem("civic_user") || "{}");
      } catch (error) {
        console.error("Local storage parse error:", error);
        savedUser = {};
      }

      toast.success("Login successful");

      if (savedUser.role === "Admin") {
        navigate("/admin");
      } else if (savedUser.role === "Field Staff") {
        navigate("/staff");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login/Signup error:", error);
      toast.error("Backend server not reachable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogins = [
    { label: "👤 Admin", email: "admin@gmail.com", password: "admin123" },
    { label: "👥 Citizen", email: "citizen@gmail.com", password: "123456" },
    { label: "💧 Water Staff", email: "water@gmail.com", password: "123456" },
    { label: "🗑️ Garbage Staff", email: "garbage@gmail.com", password: "123456" },
    { label: "🕳️ Road Staff", email: "road@gmail.com", password: "123456" },
    { label: "💡 Electrical Staff", email: "electrical@gmail.com", password: "123456" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="gradient-hero flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-accent p-3 rounded-xl">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>

            <h1 className="font-heading text-3xl font-bold text-primary-foreground">
              CivicPulse
            </h1>
            <p className="text-primary-foreground/70 mt-1 text-sm">
              Crowdsourced Civic Issue Reporting
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-6">
            <div className="flex mb-6 bg-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  !isSignup
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSignup
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <Label className="text-foreground">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Your name"
                    required
                  />
                </div>
              )}

              <div>
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <Label className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div>
                  <Label className="text-foreground">Role</Label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as Role })
                    }
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="Citizen">Citizen</option>
                    <option value="Admin">Admin</option>
                    <option value="Field Staff">Field Staff</option>
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? isSignup
                    ? "Creating Account..."
                    : "Logging in..."
                  : isSignup
                  ? "Create Account"
                  : "Login"}
              </Button>
            </form>

            {!isSignup && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Quick Login
                </p>

                <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                  {quickLogins.map((s) => (
                    <button
                      key={s.email}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          email: s.email,
                          password: s.password,
                        }))
                      }
                      className="text-xs bg-secondary hover:bg-secondary/80 rounded-lg px-3 py-2 text-left transition-colors text-foreground"
                    >
                      <span className="font-medium">{s.label}</span> — {s.email}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}