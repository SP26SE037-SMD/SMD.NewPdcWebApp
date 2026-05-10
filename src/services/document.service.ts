import { apiClient } from "@/lib/api-client";

export interface DocumentDetail {
  documentId: string;
  documentUrl: string;
  majorId: string | null;
  status: string;
  name?: string;
  description?: string;
  createdAt?: string;
}

export const DocumentService = {
  getDocument: async (id: string, options?: { signal?: AbortSignal }): Promise<DocumentDetail> => {
    const res = await apiClient.get<any>(`/api/document/${id}`, options);
    return res.data;
  },

  getAllDocuments: async (params?: { majorId?: string; status?: string }): Promise<{ data: DocumentDetail[] }> => {
    const query = new URLSearchParams();
    if (params?.majorId) query.append("majorId", params.majorId);
    if (params?.status) query.append("status", params.status);
    
    const qs = query.toString();
    const res = await fetch(`/api/document${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  }
};
