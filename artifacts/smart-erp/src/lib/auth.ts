export type Role = "owner" | "accountant" | "sales" | "warehouse" | "hr" | "data_analyst" | "admin" | "user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const TOKEN_KEY = "erp_token";
const USER_KEY = "erp_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const ROLE_PERMISSIONS: Record<Role, Array<"dashboard" | "invoices" | "warehouse" | "hr" | "accounting">> = {
  owner: ["dashboard", "invoices", "warehouse", "hr", "accounting"],
  accountant: ["dashboard", "invoices", "accounting"],
  sales: ["dashboard", "invoices"],
  warehouse: ["warehouse"],
  hr: ["hr"],
  data_analyst: ["dashboard"],
  admin: ["dashboard", "invoices", "warehouse", "hr", "accounting"],
  user: ["dashboard"],
};

