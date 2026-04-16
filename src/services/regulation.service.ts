import { apiClient } from "@/lib/api-client";

export interface Regulation {
  regulationId: string;
  code: string;
  name: string;
  description: string;
  value: number;
  createdAt: string;
}

export interface RegulationsPaginatedResponse {
  status: number;
  message: string;
  data: {
    content: Regulation[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export const RegulationService = {
  getRegulations: async (page: number = 0, size: number = 100) => {
    const queryParams = new URLSearchParams({ page: page.toString(), size: size.toString() });
    return apiClient.get<RegulationsPaginatedResponse>(`/api/regulations?${queryParams.toString()}`);
  },
};
