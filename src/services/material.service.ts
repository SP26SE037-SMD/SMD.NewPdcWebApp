import { apiClient } from "@/lib/api-client";

export interface MaterialItem {
  materialId: string;
  title: string;
  materialType: string;
  uploadedAt: string;
  id: number;
  version: number;
  syllabusId: string;
}

export const MaterialService = {
  getMaterialsBySyllabusId: async (syllabusId: string) => {
    let response: any;
    try {
      response = await apiClient.get<{ status: number; message: string; data: any }>(
        `/api/materials/syllabus/${syllabusId}?page=0&size=1000`
      );
      
      // If backend was updated to return paginated data (Page<Material>), extract the content array.
      if (response && response.data && typeof response.data === 'object' && !Array.isArray(response.data) && 'content' in response.data) {
        response.data = response.data.content;
      }
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

  deleteMaterial: async (materialId: string) => {
    return apiClient.delete<{ status: number; message: string; data: any }>(
      `/api/materials/${materialId}`
    );
  },
};


