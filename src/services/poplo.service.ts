import { apiClient } from "@/lib/api-client";
import { APIResponse } from "./curriculum.service";

export interface PoPloMapping {
    id: string;
    poId: string;
    ploId: string;
    curriculumId: string;
    createdAt?: string;
}

export const PoPloService = {
    /**
     * Get all PO-PLO mappings for a specific curriculum.
     * Usually returns a list of mapping objects each containing poId and ploId.
     */
    async getMappingsByCurriculum(curriculumId: string) {
        return apiClient.get<APIResponse<PoPloMapping[]>>(
            `/api/po-plo-mappings/curriculum/${curriculumId}`
        );
    },

    /**
     * Create a mapping between a Program Objective and a Program Learning Outcome.
     */
    async createMapping(payload: { poId: string; ploId: string }) {
        return apiClient.post<APIResponse<PoPloMapping>>(
            "/api/po-plo-mappings",
            payload
        );
    },

    /**
     * Delete a mapping by its unique ID.
     */
    async deleteMapping(mappingId: string) {
        return apiClient.delete<APIResponse<void>>(
            `/api/po-plo-mappings/${mappingId}`
        );
    },

    /**
     * Get mappings specifically for a PLO.
     */
    async getMappingsByPlo(ploId: string) {
        return apiClient.get<APIResponse<PoPloMapping[]>>(
            `/api/po-plo-mappings/plo/${ploId}`
        );
    },

    /**
     * Sync mappings in bulk.
     * Takes an array of mappings to add and an array of mappings to remove.
     */
    async bulkUpdateMappings(curriculumId: string, payload: {
        deletedMappings: { poId: string; ploId: string }[];
        addedMappings: { poId: string; ploId: string }[];
    }) {
        return apiClient.post<APIResponse<void>>(
            `/api/po-plo-mappings/bulk-configure`,
            payload
        );
    }
};
