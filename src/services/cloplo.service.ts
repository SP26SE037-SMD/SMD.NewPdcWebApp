import { ApiResponse, PageableResponse } from "@/types/api";

export interface SubjectClo {
  cloId: string;
  cloCode: string;
  description: string;
  bloomLevel?: string | number;
  status?: string;
  createdAt?: string;
}

export interface CloPloMappingDetail {
  id: string;
  cloId: string;
  ploId: string;
  contributionLevel?: "Low" | "Medium" | "High" | string;
  cloName?: string;
  ploName?: string;
  createdAt?: string;
}

export interface CloGenerationRequest {
  subjectName: string;
  topicName: string;
  bloomLevel: number;
  descriptionPlo: string;
}

export interface CloGenerationResponse {
  cloName: string;
  description: string;
}

export interface CloCheckRequest {
  cloContent: string;
  targetLevel: number;
}

export interface CloCheckResponse {
  valid: boolean;
  detectedVerb: string;
  detectedLevel: string;
  suggestion: string;
}

export interface CloPloSubjectCurriculumMapping {
  id: string;
  cloId: string;
  cloCode: string;
  cloDescription: string;
  ploId: string;
  ploCode: string;
  ploDescription: string;
  contributionLevel: string;
  createdAt: string;
}

export const CloPloService = {
  async getSubjectClos(
    subjectId: string,
    page: number = 0,
    size: number = 10,
  ): Promise<ApiResponse<PageableResponse<SubjectClo>>> {
    const response = await fetch(
      `/api/clos/subject/${subjectId}?page=${page}&size=${size}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch subject CLOs");
    }
    return response.json();
  },

  async getMappingsBySubjectAndCurriculum(
    subjectId: string,
    curriculumId: string
  ): Promise<ApiResponse<CloPloSubjectCurriculumMapping[]>> {
    const response = await fetch(`/api/clo-plo-mappings/subject/${subjectId}/curriculum/${curriculumId}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to fetch mappings");
    }
    return response.json();
  },

  async createCloMapping(payload: {
    cloId: string;
    ploId: string;
    contributionLevel: string;
  }): Promise<ApiResponse<unknown>> {
    const response = await fetch("/api/clo-plo-mappings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Failed to create CLO-PLO mapping");
    }
    return response.json();
  },
  async getCloMappingsByCloId(
    cloId: string,
  ): Promise<ApiResponse<CloPloMappingDetail[]>> {
    const response = await fetch(`/api/clo-plo-mappings/clo/${cloId}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to fetch CLO-PLO mappings");
    }

    return response.json();
  },
  async createClo(
    subjectId: string,
    clos: Array<{
      cloCode: string;
      cloName: string;
      description: string;
      bloomLevel: string;
    }>,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(`/api/clos/subject/${subjectId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clos),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to create CLO");
    }
    return response.json();
  },

  async updateClo(cloId: string, payload: any): Promise<ApiResponse<any>> {
    const response = await fetch(`/api/clos/${cloId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  async deleteClo(cloId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`/api/clos/${cloId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to delete CLO");
    }

    return response.json().catch(() => ({
      status: 1000,
      message: "CLO deleted successfully",
    }));
  },

  async generateClo(
    payload: CloGenerationRequest,
  ): Promise<CloGenerationResponse> {
    const response = await fetch("/api/clos/generate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to generate CLO");
    }

    const result = await response.json();

    if (typeof result?.status === "number" && result.status !== 1000) {
      throw new Error(result?.message || "Failed to generate CLO");
    }

    const normalized = result?.data || result;
    if (!normalized?.cloName || !normalized?.description) {
      throw new Error("AI response is invalid. Please try generating again.");
    }

    return normalized;
  },

  async bulkConfigure(payload: any): Promise<ApiResponse<any>> {
    const response = await fetch(`/api/clo-plo-mappings/bulk`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  async checkClo(payload: CloCheckRequest): Promise<CloCheckResponse> {
    const response = await fetch("/api/clos/check", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let result: { status?: number; message?: string; data?: unknown } | null =
      null;
    if (rawText) {
      try {
        result = JSON.parse(rawText) as {
          status?: number;
          message?: string;
          data?: unknown;
        };
      } catch {
        throw new Error("CLO check response is invalid.");
      }
    }

    if (!response.ok) {
      throw new Error(result?.message || "Failed to check CLO");
    }

    if (typeof result?.status === "number" && result.status !== 1000) {
      if (
        result.status === 9002 ||
        String(result?.message || "")
          .toLowerCase()
          .includes("valid json format")
      ) {
        throw new Error(
          "AI returned an unstable response format. Please click Check CLO again.",
        );
      }

      throw new Error(result?.message || "Failed to check CLO");
    }

    const normalized = (result?.data ??
      result) as Partial<CloCheckResponse> | null;
    if (!normalized || typeof normalized.valid !== "boolean") {
      throw new Error("CLO check response is invalid.");
    }

    return {
      valid: normalized.valid,
      detectedVerb: String(normalized.detectedVerb ?? ""),
      detectedLevel: String(normalized.detectedLevel ?? ""),
      suggestion: String(normalized.suggestion ?? ""),
    };
  },
};
