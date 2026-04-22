"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SubjectService } from "@/services/subject.service";
import { CurriculumService } from "@/services/curriculum.service";
import { CloPloService } from "@/services/cloplo.service";

export function useSubjectMappingLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

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
    queryKey: ["curriculum-plos", curriculumId, "INTERNAL_REVIEW"],
    queryFn: () =>
      CurriculumService.getPloByCurriculumId(curriculumId!, "INTERNAL_REVIEW"),
    enabled: !!curriculumId,
  });

  const { data: cloRes, isLoading: isCloLoading } = useQuery({
    queryKey: ["subject-clos", subjectId],
    queryFn: () => CloPloService.getSubjectClos(subjectId!),
    enabled: !!subjectId,
  });

  const plos = (ploRes?.data?.content ?? []).filter(
    (plo) => plo.status?.toUpperCase() === "INTERNAL_REVIEW",
  );
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
    setMappingNotice("");

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
      setMappingNotice("No changes to sync.");
      setSubmittingKey(null);
      return;
    }

    try {
      await CloPloService.bulkConfigure({
        addedMappings,
        deletedMappings,
      });

      setMappingNotice("Matrix synchronized successfully.");
      await queryClient.invalidateQueries({
        queryKey: ["clo-plo-mappings", subjectId, curriculumId],
      });
      setTimeout(() => setMappingNotice(""), 5000);
    } catch (err: any) {
      setMappingNotice(err.message || "Failed to sync matrix.");
    } finally {
      setSubmittingKey(null);
    }
  };

  const deleteClo = async (cloId: string) => {
    setDeletingCloId(cloId);
    setMappingNotice("");

    try {
      await CloPloService.deleteClo(cloId);
      setMappingNotice("CLO deleted successfully.");
      setTimeout(() => setMappingNotice(""), 5000);
      await queryClient.invalidateQueries({
        queryKey: ["subject-clos", subjectId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["clo-plo-mappings", subjectId, curriculumId],
      });
    } catch (deleteError) {
      setMappingNotice(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete CLO.",
      );
    } finally {
      setDeletingCloId(null);
    }
  };

  const goToReceiveTasks = () => {
    const sprintId = searchParams.get("sprintId");
    if (sprintId && curriculumId) {
      router.push(
        `/dashboard/hopdc/assignments?sprintId=${sprintId}&curriculumId=${curriculumId}`,
      );
    } else {
      router.push("/dashboard/hopdc/sprint-management");
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
  };
}
