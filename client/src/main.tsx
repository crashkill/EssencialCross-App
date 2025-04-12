import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./index.css";

// Mock auth provider for development
import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthState } from "./types";

const MockAuthContext = createContext<any>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: { id: 1, username: "demo", createdAt: new Date().toISOString() },
    isAuthenticated: true,
    isLoading: false,
  });

  return (
    <MockAuthContext.Provider
      value={{
        ...authState,
        login: async () => {},
        register: async () => {},
        logout: async () => {},
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

// Use this for development instead of real AuthProvider
const AuthProviderWrapper = process.env.NODE_ENV === 'development' 
  ? MockAuthProvider 
  : AuthProvider;

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <AuthProviderWrapper>
        <App />
      </AuthProviderWrapper>
    </QueryClientProvider>
  );
}
