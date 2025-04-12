import { apiRequest } from "./queryClient";
import { AuthUser, LoginCredentials, RegisterData } from "@/types";

export async function loginUser(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return response.json();
}

export async function registerUser(userData: RegisterData): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  return response.json();
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest("GET", "/api/user");
  return response.json();
}

export async function getSession(): Promise<{ isAuthenticated: boolean; userId?: number }> {
  const response = await apiRequest("GET", "/api/auth/session");
  return response.json();
}
