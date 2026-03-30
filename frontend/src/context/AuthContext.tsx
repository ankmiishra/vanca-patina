import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── helpers ────────────────────────────────────────────────────────────────

const storeAuth = (data: { accessToken: string; refreshToken?: string; _id: string; name: string; email: string; role: string }) => {
  localStorage.setItem("token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("role", data.role);
  // Persist user info so page refresh doesn't lose identity
  localStorage.setItem("user", JSON.stringify({
    _id: data._id,
    name: data.name,
    email: data.email,
    role: data.role,
  }));
};

const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
};

// ─── provider ───────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { loginUser } = await import("@/services/authService");
    const data = await loginUser(email, password);

    storeAuth(data);
    setToken(data.accessToken);
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { registerUser } = await import("@/services/authService");
    const data = await registerUser(name, email, password);

    storeAuth(data);
    setToken(data.accessToken);
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
  }, []);

  const logout = useCallback(async () => {
    try {
      const { logoutUser } = await import("@/services/authService");
      await logoutUser();
    } catch {
      // Ignore — we clear local state regardless
    }

    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};