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
  const [createdMappings, setCreatedMappings] = useState<
    Record<string, boolean>
  >({});
  const [mappingNotice, setMappingNotice] = useState<string>("");
  const [deletingCloId, setDeletingCloId] = useState<string | null>(null);

  const cloIdsSignature = clos.map((clo) => clo.cloId).join("|");
  const ploIdsSignature = plos.map((p) => p.ploId).join("|");
  const { data: persistedMappings } = useQuery({
    queryKey: ["clo-plo-mappings-by-clos", subjectId, cloIdsSignature, ploIdsSignature],
    enabled: !!subjectId && clos.length > 0 && plos.length > 0,
    queryFn: async () => {
      const settled = await Promise.allSettled(
        clos.map((clo) => CloPloService.getCloMappingsByCloId(clo.cloId)),
      );

      const mapped: Record<
        string,
        { ploId: string; contributionLevel: "Low" | "Medium" | "High" }
      > = {};

      const currentPloIds = new Set(plos.map((p) => p.ploId));

      settled.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          return;
        }

        const payload = result.value?.data;
        if (!Array.isArray(payload) || payload.length === 0) {
          return;
        }

        // Only find a mapping that belongs to the CURRENT curriculum's PLO list
        const match = payload.find((m) => currentPloIds.has(m.ploId));
        if (!match) {
          return;
        }

        const levelRaw = String(match.contributionLevel || "Low");
        const normalizedLevel =
          levelRaw === "Medium" || levelRaw === "High" ? levelRaw : "Low";

        mapped[clos[index].cloId] = {
          ploId: match.ploId,
          contributionLevel: normalizedLevel,
        };
      });

      return mapped;
    },
  });

  useEffect(() => {
    if (!persistedMappings) {
      return;
    }

    setLocalMapping((prev) => {
      const next = { ...prev };
      Object.entries(persistedMappings).forEach(([cloId, value]) => {
        next[cloId] = value.ploId;
      });
      return next;
    });

    setLocalContributionLevel((prev) => {
      const next = { ...prev };
      Object.entries(persistedMappings).forEach(([cloId, value]) => {
        next[cloId] = value.contributionLevel;
      });
      return next;
    });

    setCreatedMappings((prev) => {
      const next = { ...prev };
      Object.keys(persistedMappings).forEach((cloId) => {
        next[cloId] = true;
      });
      return next;
    });
  }, [persistedMappings]);

  const getSelectedPloId = (cloId: string) => {
    return localMapping[cloId] || "";
  };

  const getContributionLevel = (cloId: string) => {
    return localContributionLevel[cloId] || "Low";
  };

  const createSingleMapping = async (
    cloId: string,
    ploId: string,
    contributionLevel: "Low" | "Medium" | "High",
  ) => {
    if (createdMappings[cloId]) {
      setMappingNotice("This CLO is already mapped.");
      return;
    }

    if (!ploId) {
      setMappingNotice("Please select a PLO before creating mapping.");
      return;
    }

    setSubmittingKey(cloId);
    setMappingNotice("");

    try {
      await CloPloService.createCloMapping({
        cloId,
        ploId,
        contributionLevel,
      });

      setCreatedMappings((prev) => ({ ...prev, [cloId]: true }));
      setMappingNotice("CLO-PLO mapping created successfully.");
      await queryClient.invalidateQueries({
        queryKey: ["clo-plo-mappings-by-clos", subjectId],
      });
    } catch (createError) {
      setMappingNotice(
        createError instanceof Error
          ? createError.message
          : "Failed to create CLO-PLO mapping.",
      );
    } finally {
      setSubmittingKey(null);
    }
  };

  const createAllMappings = async () => {
    const payloads = clos
      .map((clo) => ({
        cloId: clo.cloId,
        ploId: getSelectedPloId(clo.cloId),
        contributionLevel: getContributionLevel(clo.cloId),
      }))
      .filter((item) => {
        const isMappedInThisContext = !!createdMappings[item.cloId];
        // If it's not mapped, or if the selected PLO is different from what's persisted (update case)
        return !!item.ploId && !isMappedInThisContext;
      });

    if (payloads.length === 0) {
      if (plos.length === 0) {
        setMappingNotice(
          "No PLOs found with INTERNAL_REVIEW status. Mappings can only be created for PLOs in review.",
        );
      } else {
        setMappingNotice("Please select at least one PLO to create mappings.");
      }
      return;
    }

    setSubmittingKey("all");
    setMappingNotice("");

    try {
      for (const payload of payloads) {
        await CloPloService.createCloMapping({
          cloId: payload.cloId,
          ploId: payload.ploId,
          contributionLevel: payload.contributionLevel,
        });
      }

      setCreatedMappings((prev) => {
        const next = { ...prev };
        payloads.forEach((item) => {
          next[item.cloId] = true;
        });
        return next;
      });
      setMappingNotice(`Created ${payloads.length} mapping(s) successfully.`);
      await queryClient.invalidateQueries({
        queryKey: ["clo-plo-mappings-by-clos", subjectId],
      });
    } catch (createError) {
      setMappingNotice(
        createError instanceof Error
          ? createError.message
          : "Failed to create CLO-PLO mappings.",
      );
    } finally {
      setSubmittingKey(null);
    }
  };

  const deleteClo = async (cloId: string) => {
    setDeletingCloId(cloId);
    setMappingNotice("");

    try {
      await CloPloService.deleteClo(cloId);

      setLocalMapping((prev) => {
        const next = { ...prev };
        delete next[cloId];
        return next;
      });

      setLocalContributionLevel((prev) => {
        const next = { ...prev };
        delete next[cloId];
        return next;
      });

      setCreatedMappings((prev) => {
        const next = { ...prev };
        delete next[cloId];
        return next;
      });

      setMappingNotice("CLO deleted successfully.");
      setTimeout(() => {
        setMappingNotice("");
      }, 5000);
      await queryClient.invalidateQueries({
        queryKey: ["subject-clos", subjectId],
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
    localMapping,
    setLocalMapping,
    localContributionLevel,
    setLocalContributionLevel,
    submittingKey,
    createdMappings,
    mappingNotice,
    deletingCloId,
    createSingleMapping,
    createAllMappings,
    deleteClo,
    goToReceiveTasks,
  };
}
