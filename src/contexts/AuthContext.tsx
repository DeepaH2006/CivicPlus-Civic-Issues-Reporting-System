
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { User, Role } from "@/data/store";

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: Role,
    verificationCode?: string
  ) => Promise<AuthResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo verification codes
const ADMIN_DEMO_CODE = "CP-ADMIN-2026";
const STAFF_DEMO_CODE = "CP-STAFF-2026";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("civic_user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse saved user:", error);
      localStorage.removeItem("civic_user");
    }
  }, []);

  // LOGIN
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<AuthResult> => {
      try {
        const response = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const contentType = response.headers.get("content-type");
        const data = contentType?.includes("application/json")
          ? await response.json()
          : { message: await response.text() };

        if (!response.ok) {
          return {
            success: false,
            error: data?.message || "Invalid email or password",
          };
        }

        const loggedInUser = data.user || data;

        const normalizedUser = {
          ...loggedInUser,
          id: loggedInUser.id || loggedInUser._id,
        };

        setUser(normalizedUser);

        localStorage.setItem(
          "civic_user",
          JSON.stringify(normalizedUser)
        );

        return { success: true };
      } catch (error) {
        console.error("Login error:", error);

        return {
          success: false,
          error: "Server not reachable",
        };
      }
    },
    []
  );

  // SIGNUP
  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: Role,
      verificationCode?: string
    ): Promise<AuthResult> => {
      const code = verificationCode?.trim();

      // Validate Admin verification code before API request
      if (role === "Admin" && code !== ADMIN_DEMO_CODE) {
        return {
          success: false,
          error: "Invalid Government Admin Verification Code",
        };
      }

      // Validate Field Staff verification code before API request
      if (role === "Field Staff" && code !== STAFF_DEMO_CODE) {
        return {
          success: false,
          error: "Invalid Field Staff Verification Code",
        };
      }

      try {
        const response = await fetch(`${API_BASE}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            verificationCode: code,
          }),
        });

        const contentType = response.headers.get("content-type");
        const data = contentType?.includes("application/json")
          ? await response.json()
          : { message: await response.text() };

        if (!response.ok) {
          return {
            success: false,
            error: data?.message || "Signup failed",
          };
        }

        const registeredUser = data?.user || data;

        const newUser = {
          ...registeredUser,
          id:
            registeredUser?.id ||
            registeredUser?._id ||
            `u${Date.now()}`,
          name: registeredUser?.name || name,
          email: registeredUser?.email || email,
          role: registeredUser?.role || role,
        } as User;

        setUser(newUser);

        localStorage.setItem(
          "civic_user",
          JSON.stringify(newUser)
        );

        return { success: true };
      } catch (error) {
        console.error("Signup error:", error);

        return {
          success: false,
          error: "Server not reachable",
        };
      }
    },
    []
  );

  // LOGOUT
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("civic_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
