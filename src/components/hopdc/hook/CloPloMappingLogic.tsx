"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SubjectService } from "@/services/subject.service";
import { CurriculumService } from "@/services/curriculum.service";
import { CloPloService } from "@/services/cloplo.service";
import { useToast } from "@/components/ui/Toast";

export function useSubjectMappingLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const subjectId = searchParams.get("subjectId") ?? searchParams.get("id");
  const curriculumId = searchParams.get("curriculumId");

  const {
    data: subjectRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subject-detail", subjectId],
    queryFn: () => SubjectService.getSubjectDetail(subjectId!),
    enabled: !!subjectId,
  });

  const subject = subjectRes;

  const { data: ploRes, isLoading: isPloLoading } = useQuery({
    queryKey: ["curriculum-plos", curriculumId],
    queryFn: () =>
      CurriculumService.getPloByCurriculumId(curriculumId!),
    enabled: !!curriculumId,
  });

  const { data: cloRes, isLoading: isCloLoading } = useQuery({
    queryKey: ["subject-clos", subjectId],
    queryFn: () => CloPloService.getSubjectClos(subjectId!),
    enabled: !!subjectId,
  });

  const plos = ploRes?.data?.content ?? [];
  const clos = cloRes?.data?.content ?? [];

  const [localMapping, setLocalMapping] = useState<Record<string, string>>({});
  const [localContributionLevel, setLocalContributionLevel] = useState<
    Record<string, "Low" | "Medium" | "High">
  >({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [mappingNotice, setMappingNotice] = useState<string>("");
  const [deletingCloId, setDeletingCloId] = useState<string | null>(null);

  // Matrix State: Set of "cloId:ploId" strings
  const [matrixMappings, setMatrixMappings] = useState<Set<string>>(new Set());

  const { data: persistedMappingsData, isLoading: isMappingLoading } = useQuery({
    queryKey: ["clo-plo-mappings", subjectId, curriculumId],
    enabled: !!subjectId && !!curriculumId,
    queryFn: () =>
      CloPloService.getMappingsBySubjectAndCurriculum(subjectId!, curriculumId!),
  });

  const persistedMappings = persistedMappingsData?.data || [];

  // Sync matrix state when persisted data loads
  useEffect(() => {
    if (persistedMappings.length > 0) {
      const newMatrix = new Set<string>();
      persistedMappings.forEach((m) => {
        newMatrix.add(`${m.cloId}:${m.ploId}`);
      });
      setMatrixMappings(newMatrix);
    }
  }, [persistedMappingsData]);

  const toggleMapping = (cloId: string, ploId: string) => {
    setMatrixMappings((prev) => {
      const next = new Set(prev);
      const key = `${cloId}:${ploId}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isMapped = (cloId: string, ploId: string) => {
    return matrixMappings.has(`${cloId}:${ploId}`);
  };

  const syncMatrix = async () => {
    if (!subjectId || !curriculumId) return;

    setSubmittingKey("sync");

    const currentPersistedSet = new Set(
      persistedMappings.map((m) => `${m.cloId}:${m.ploId}`),
    );

    const addedMappings: any[] = [];
    const deletedMappings: any[] = [];

    // Find added
    matrixMappings.forEach((key) => {
      if (!currentPersistedSet.has(key)) {
        const [cloId, ploId] = key.split(":");
        addedMappings.push({ cloId, ploId, contributionLevel: "High" });
      }
    });

    // Find deleted
    currentPersistedSet.forEach((key) => {
      if (!matrixMappings.has(key)) {
        const [cloId, ploId] = key.split(":");
        deletedMappings.push({ cloId, ploId, contributionLevel: "High" });
      }
    });

    if (addedMappings.length === 0 && deletedMappings.length === 0) {
      showToast("No changes to sync.", "info");
      setSubmittingKey(null);
      return;
    }

    try {
      await CloPloService.bulkConfigure({
        addedMappings,
        deletedMappings,
      });

      showToast("Matrix synchronized successfully.", "success");
      await queryClient.invalidateQueries({
        queryKey: ["clo-plo-mappings", subjectId, curriculumId],
      });
    } catch (err: any) {
      showToast(err.message || "Failed to sync matrix.", "error");
    } finally {
      setSubmittingKey(null);
    }
  };

  const deleteClo = async (cloId: string) => {
    setDeletingCloId(cloId);

    try {
      await CloPloService.deleteClo(cloId);
      showToast("CLO deleted successfully.", "success");
      await queryClient.invalidateQueries({
        queryKey: ["subject-clos", subjectId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["clo-plo-mappings", subjectId, curriculumId],
      });
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete CLO.",
        "error",
      );
    } finally {
      setDeletingCloId(null);
    }
  };

  const handleImportClos = async (file: File) => {
    if (!subjectId) return;
    setSubmittingKey("import");

    try {
      const response = await CloPloService.importClos(file);
      
      // If there are failures, we don't invalidate queries yet 
      // because we want the user to fix the file first
      if (response?.data && response.data.failed === 0) {
        showToast("Successfully imported all CLOs from Excel.", "success");
        await queryClient.invalidateQueries({
          queryKey: ["subject-clos", subjectId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["clo-plo-mappings", subjectId, curriculumId],
        });
      }

      return response; // Return full response
    } catch (err: any) {
      showToast(err.message || "Failed to import CLOs.", "error");
      return { status: 500, message: err.message };
    } finally {
      setSubmittingKey(null);
    }
  };

  const goToReceiveTasks = () => {
    const sprintId = searchParams.get("sprintId")?.trim();
    const curriculumIdParam = searchParams.get("curriculumId")?.trim();
    
    if (sprintId && curriculumIdParam && sprintId !== "" && curriculumIdParam !== "") {
      router.push(
        `/dashboard/hopdc/assignments?sprintId=${sprintId}&curriculumId=${curriculumIdParam}`,
      );
    } else {
      router.push("/dashboard/hopdc/department-tasks?tab=single-tasks");
    }
  };

  const persistedSet = new Set(
    persistedMappings.map((m) => `${m.cloId}:${m.ploId}`),
  );

  const addedCount = [...matrixMappings].filter(
    (m) => !persistedSet.has(m),
  ).length;
  const deletedCount = [...persistedSet].filter(
    (m) => !matrixMappings.has(m),
  ).length;
  const hasUnsavedChanges = addedCount > 0 || deletedCount > 0;

  return {
    subjectId,
    curriculumId,
    subject,
    isLoading,
    error,
    plos,
    clos,
    isPloLoading,
    isCloLoading,
    isMappingLoading,
    matrixMappings,
    toggleMapping,
    isMapped,
    syncMatrix,
    submittingKey,
    mappingNotice,
    deletingCloId,
    deleteClo,
    goToReceiveTasks,
    hasUnsavedChanges,
    addedCount,
    deletedCount,
    handleImportClos,
  };
}
