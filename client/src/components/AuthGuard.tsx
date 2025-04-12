import React from "react";
import { useLocation } from "wouter";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Simplified AuthGuard for testing in development
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [, navigate] = useLocation();

  // For development, we're always authenticated
  const isAuthenticated = process.env.NODE_ENV === 'development' ? true : false;

  // In production, check for authentication and redirect
  if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
    navigate("/login");
    return null;
  }

  // Se estiver autenticado, renderiza os componentes filhos
  return <>{children}</>;
};

export default AuthGuard;
