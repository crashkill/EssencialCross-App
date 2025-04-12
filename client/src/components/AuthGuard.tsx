import React from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Simplified AuthGuard for testing
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // Always render children for testing
  return <>{children}</>;
};

export default AuthGuard;
