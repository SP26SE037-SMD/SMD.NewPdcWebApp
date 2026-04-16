// Central type definitions and constants for Auth.
// Backend response types from: http://43.207.156.116:8080/api/auth/login

// export interface Permission {
//     permissionId: string;
//     permissionName: string;
//     description: string;
//     createdAt: string;
// }

// export interface Role {
//     roleId: string;
//     roleName: string;
//     description: string;
//     permissions: Permission[];
//     createdAt: string;
// }

export interface Account {
  accountId: string;
  email: string;
  fullName: string;
  role:
    | string
    | {
        roleId?: string;
        roleName?: string;
        description?: string;
        permissions?: any[];
        createdAt?: string;
      };
  departmentId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

// Simplified user object for frontend use (stored in smd-user cookie)
export interface User {
  id: string; // Alias for accountId for UI consistency
  accountId: string;
  email: string;
  fullName: string;
  role: string;
  departmentId?: string;
  permissions?: string[];
}

export interface LoginResponse {
  status: number;
  message: string;
  data: {
    token: string;
    authenticated: boolean;
    account: Account;
  };
}

// Cookie names
export const AUTH_TOKEN_COOKIE = "smd-token"; // HttpOnly — stores JWT
export const AUTH_USER_COOKIE = "smd-user"; // Regular — stores user info for UI

// Role-to-path mapping for RBAC
export const ROLE_PATHS: Record<string, string> = {
  PDCM: "pdcm",
  HOPDC: "hopdc",
  HOCFDC: "hocfdc",
  VP: "vice-principal",
  COLLABORATOR: "collaborator",
};

/**
 * Helper: Convert full Account from Backend into a lightweight User for the cookie.
 * Handles role as either a string or an object with roleName property.
 */
export function accountToUser(account: Account): User {
  // Extract role as a string, handling both string and object formats
  let roleString = "";
  if (typeof account.role === "string") {
    roleString = account.role;
  } else if (account.role && typeof account.role === "object") {
    roleString =
      (account.role as any).roleName || (account.role as any).roleId || "";
  }

  return {
    id: account.accountId,
    accountId: account.accountId,
    email: account.email,
    fullName: account.fullName,
    role: roleString,
    departmentId: account.departmentId,
  };
}

/**
 * Introspect token with the backend.
 * POST /api/auth/introspect?token={token}
 */
export async function introspectToken(token: string): Promise<boolean> {
  try {
    const BACKEND_URL = process.env.BACKEND_URL;
    const response = await fetch(
      `${BACKEND_URL}/api/auth/introspect?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.data === true;
  } catch (error) {
    console.error("Introspection Error:", error);
    return false;
  }
}
