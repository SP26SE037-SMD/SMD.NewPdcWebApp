import { apiClient } from "@/lib/api-client";

export interface MaterialItem {
  materialId: string;
  title: string;
  materialType: string;
  uploadedAt: string;
  id: number;
  version: number;
  status: string;
  syllabusId: string;
}

export const MaterialService = {
  getMaterialsBySyllabusId: async (syllabusId: string, status?: string) => {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    let response: any;
    try {
      response = await apiClient.get<{ status: number; message: string; data: MaterialItem[] }>(
        `/api/materials/syllabus/${syllabusId}${queryString}`
      );
    } catch (err) {
      console.warn("API Call for materials failed, using mock container", err);
      response = { status: 200, message: "Mock Container", data: [] };
    }

    return response;
  },

  createMaterial: async (data: { title: string; materialType: string; id: number; syllabusId: string }) => {
    return apiClient.post<{ status: number; message: string; data: MaterialItem }>(
      `/api/materials`,
      data
    );
  },

  updateSyllabusMaterialsStatus: async (syllabusId: string, newStatus: string) => {
    return apiClient.patch(`/api/materials/syllabus/${syllabusId}/status?newStatus=${newStatus}`, {});
  },

  getMaterialById: async (materialId: string) => {
    return apiClient.get<{ status: number; message: string; data: any }>(
      `/api/materials/${materialId}`
    );
  },

  updateMaterial: async (materialId: string, data: { title: string; materialType: string; id: number; syllabusId: string }) => {
    return apiClient.put<{ status: number; message: string; data: MaterialItem }>(
      `/api/materials/${materialId}`,
      data
    );
  },

  updateMaterialStatus: async (materialId: string, newStatus: string) => {
    const url = `/api/materials/${materialId}/status?newStatus=${newStatus}`;
    console.log(`[API DEBUG] PATCH Material Status - URL: ${url}`);
    return apiClient.patch(url, {});
  },
};

