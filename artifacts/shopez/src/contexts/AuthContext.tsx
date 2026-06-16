import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { setToken as setLocalToken, clearToken, getToken } from "@/lib/auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState(!!getToken());
  
  const { data: user, isLoading, isError } = useGetMe({ 
    query: { 
      enabled: hasToken,
      retry: false
    } as any
  });

  useEffect(() => {
    if (isError) {
      clearToken();
      setHasToken(false);
    }
  }, [isError]);

  const login = (token: string) => {
    setLocalToken(token);
    setHasToken(true);
  };

  const logout = () => {
    clearToken();
    setHasToken(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isLoading && hasToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
