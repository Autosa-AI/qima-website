"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  isActive: boolean;
}

interface AdminContextType {
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("qima_admin_token") : null);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
    } catch {
      // best effort
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("qima_admin_token");
    }
    setAdmin(null);
    setToken(null);
    router.replace("/admin");
  }, [router, token]);

  const fetchWithAuth = useCallback(
    (url: string, options: RequestInit = {}): Promise<Response> => {
      const t =
        token ??
        (typeof window !== "undefined"
          ? localStorage.getItem("qima_admin_token")
          : null);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (t) {
        headers["Authorization"] = `Bearer ${t}`;
      }
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  useEffect(() => {
    async function hydrate() {
      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("qima_admin_token")
            : null;
        setToken(storedToken);

        const res = await fetch("/api/auth/me", {
          headers: storedToken
            ? { Authorization: `Bearer ${storedToken}` }
            : {},
        });

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        if (data.success && data.data) {
          setAdmin(data.data as AdminUser);
        } else {
          throw new Error("Invalid response");
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("qima_admin_token");
        }
        router.replace("/admin");
      } finally {
        setLoading(false);
      }
    }

    hydrate();
  }, [router]);

  return (
    <AdminContext.Provider
      value={{ admin, token, loading, logout, fetchWithAuth }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
