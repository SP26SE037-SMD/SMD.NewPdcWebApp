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
  getDocument: async (id: string): Promise<DocumentDetail> => {
    const res = await apiClient.get<any>(`/api/document/${id}`);
    return res.data;
  }
};
