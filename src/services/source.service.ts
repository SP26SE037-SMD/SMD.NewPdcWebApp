import { ApiResponse } from "@/types/api";

export interface SourcePayload {
  sourceName: string;
  type: string;
  author: string;
  publisher: string;
  publishedYear: number;
  isbn: string;
  url: string;
}

export const SourceService = {
  async getSyllabusSources(
    syllabusId: string,
  ): Promise<ApiResponse<unknown[]>> {
    const response = await fetch(`/api/syllabus-sources/${syllabusId}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to fetch syllabus sources");
    }
    return response.json();
  },

  async getSubjectSources(
    subjectId: string,
  ): Promise<ApiResponse<any[]>> {
    const response = await fetch(`/api/sources/subject/${subjectId}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to fetch subject sources");
    }
    return response.json();
  },

  async createSource(payload: SourcePayload): Promise<ApiResponse<unknown>> {
    const response = await fetch("/api/sources", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to create source");
    }

    return response.json();
  },

  async linkSourcesToSyllabus(
    syllabusId: string,
    sourceIds: string[],
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `/api/syllabus-sources/${syllabusId}/sources`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify(sourceIds),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message || "Failed to link source to syllabus",
      );
    }

    return response.json();
  },

  async deleteSource(sourceId: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`/api/sources/${sourceId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "*/*" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to delete source");
    }

    return response.json().catch(() => ({
      status: 1000,
      message: "Source deleted successfully",
    }));
  },

  async unlinkSourceFromSyllabus(
    syllabusId: string,
    sourceId: string,
  ): Promise<ApiResponse<unknown>> {
    const response = await fetch(
      `/api/syllabus-sources/${syllabusId}/sources/${sourceId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { accept: "*/*" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message || "Failed to unlink source from syllabus",
      );
    }

    return response.json();
  },
};
