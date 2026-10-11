
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
  });

  const roleRedirect: Record<Role, string> = {
    Citizen: "/dashboard",
    Admin: "/admin",
    "Field Staff": "/staff",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (
      !form.email.trim() ||
      !form.password ||
      (isSignup && !form.name.trim())
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        // Public registration is always for citizens.
        // The backend must enforce this restriction too.
        const res = await signup(
          form.name.trim(),
          form.email.trim(),
          form.password,
          "Citizen"
        );

        if (!res.success) {
          toast.error(res.error || "Account creation failed");
          return;
        }

        toast.success("Citizen account created successfully");
        navigate("/dashboard");
        return;
      }

      const res = await login(
        form.email.trim(),
        form.password
      );

      if (!res.success) {
        toast.error(res.error || "Login failed");
        return;
      }

      let savedUser: { role?: Role } = {};

      try {
        savedUser = JSON.parse(
          localStorage.getItem("civic_user") || "{}"
        );
      } catch {
        toast.error("Unable to read your account information");
        return;
      }

      toast.success("Login successful");

      if (savedUser.role === "Admin") {
        navigate("/admin");
      } else if (savedUser.role === "Field Staff") {
        navigate("/staff");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login/Signup error:", error);
      toast.error("Unable to connect to the server");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              CivicPluse
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
                    autoComplete="name"
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
                  autoComplete="email"
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
                      setForm({
                        ...form,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter your password"
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                <p className="text-sm text-muted-foreground">
                  New accounts are registered as Citizens.
                  Staff accounts are created by an administrator.
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isSignup
                    ? "Creating Account..."
                    : "Logging in..."
                  : isSignup
                    ? "Create Citizen Account"
                    : "Login"}
              </Button>
            </form>

            {!isSignup && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Citizen Demo Login
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      email: "citizen@gmail.com",
                      password: "123456",
                    }))
                  }
                  className="w-full text-xs bg-secondary hover:bg-secondary/80 rounded-lg px-3 py-3 text-left transition-colors text-foreground"
                >
                  <span className="font-medium">👤 Citizen</span>
                  {" "}— citizen@gmail.com
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
