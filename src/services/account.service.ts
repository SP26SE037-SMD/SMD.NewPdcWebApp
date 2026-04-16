import { apiClient } from "@/lib/api-client";

type UnknownRecord = Record<string, unknown>;

export interface DepartmentAccount {
  accountId: string;
  fullName: string;
  email: string;
  roleName: string;
  departmentId?: string;
  avatarUrl?: string | null;
}

function toAccount(item: unknown): DepartmentAccount {
  const acc = item && typeof item === "object" ? (item as UnknownRecord) : {};
  const role =
    acc.role && typeof acc.role === "object"
      ? (acc.role as UnknownRecord)
      : undefined;

  const roleName =
    typeof acc.roleName === "string"
      ? acc.roleName
      : typeof role?.roleName === "string"
        ? role.roleName
        : typeof acc.role === "string"
          ? acc.role
          : "";

  return {
    accountId: String(acc.accountId ?? acc.id ?? ""),
    fullName: String(acc.fullName ?? acc.name ?? ""),
    email: String(acc.email ?? ""),
    roleName,
    avatarUrl:
      typeof acc.avatarUrl === "string" || acc.avatarUrl === null
        ? (acc.avatarUrl as string | null)
        : undefined,
    departmentId:
      typeof acc.departmentId === "string"
        ? acc.departmentId
        : typeof acc.department_id === "string"
          ? acc.department_id
          : undefined,
  };
}

export const AccountService = {
  async getAccountsByDepartment(
    departmentId: string,
  ): Promise<DepartmentAccount[]> {
    const response = await apiClient.get<unknown>(
      `/api/accounts/department/${departmentId}`,
      {
        credentials: "include",
      },
    );

    const payload =
      response && typeof response === "object"
        ? (response as UnknownRecord)
        : {};
    const data = payload.data;

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => toAccount(item))
      .filter((item) => !!item.accountId);
  },

  async getAvailableAccountsBySyllabusId(
    syllabusId: string,
  ): Promise<DepartmentAccount[]> {
    const searchParams = new URLSearchParams({ syllabusId });

    const response = await apiClient.get<unknown>(
      `/api/accounts/department/available-account-ids?${searchParams.toString()}`,
      {
        credentials: "include",
      },
    );

    const payload =
      response && typeof response === "object"
        ? (response as UnknownRecord)
        : {};
    const data = payload.data;

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => toAccount(item))
      .filter((item) => !!item.accountId);
  },
};
