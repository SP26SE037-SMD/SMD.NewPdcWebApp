import { apiClient } from "@/lib/api-client";

export interface CreateBlockParams {
  blockStyle: string;
  blockType?: string;
  contentText: string;
  idx?: number;
}

export interface BlockItem {
  blockId: string;
  idx: number;
  blockStyle: string;
  blockType?: string;
  contentText: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BulkUpdateBlocksParams {
  deleteBlockList: string[];
  blocks: {
    blockId?: string;
    idx: number;
    blockStyle: string;
    blockType: string;
    contentText: string;
  }[];
}

export const BlockService = {
  getBlocksByMaterialId: async (materialId: string, page: number = 1, size: number = 20) => {
    return apiClient.get<{ status: number; message: string; data: PagedResponse<BlockItem> }>(
      `/api/blocks/material/${materialId}?page=${page}&size=${size}`
    );
  },

  getBlocksByMaterialIdAndType: async (materialId: string, blockType: string) => {
    return apiClient.get<{ status: number; message: string; data: BlockItem[] }>(
      `/api/blocks/material/${materialId}/by-type?blockType=${blockType}`
    );
  },

  bulkUpdateBlocks: async (materialId: string, params: BulkUpdateBlocksParams) => {
    return apiClient.put<{ status: number; message: string; data: BlockItem[] }>(
      `/api/blocks/material/${materialId}`,
      params
    );
  },

  createBlocks: async (materialId: string, blocks: CreateBlockParams[]) => {
    return apiClient.post<{ status: number; message: string; data: BlockItem[] }>(
      `/api/blocks/material/${materialId}`,
      blocks
    );
  },

  updateBlock: async (blockId: string, data: CreateBlockParams) => {
    return apiClient.put<{ status: number; message: string; data: BlockItem }>(
      `/api/blocks/${blockId}`,
      data
    );
  },

  createSingleBlock: async (materialId: string, block: CreateBlockParams) => {
    return apiClient.post<{ status: number; message: string; data: BlockItem }>(
      `/api/blocks/material/${materialId}/single`,
      block
    );
  },

  updateBlockList: async (blocks: any[]) => {
    return apiClient.put<{ status: number; message: string; data: BlockItem[] }>(
      `/api/blocks/update-list`,
      blocks
    );
  },

  deleteBlock: async (blockId: string) => {
    return apiClient.delete<{ status: number; message: string; data: {} }>(
      `/api/blocks/${blockId}`
    );
  },
  createBlocksWithIdx: async (materialId: string, blocks: { blockStyle: string; blockType: string; contentText: string; idx: number }[]) => {
    return apiClient.post<{ status: number; message: string; data: BlockItem[] }>(
      `/api/blocks/material/${materialId}/with-idx`,
      blocks
    );
  },
};

