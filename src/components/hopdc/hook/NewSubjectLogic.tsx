"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { SyllabusService } from "@/services/syllabus.service";
import { TaskService } from "@/services/task.service";
import { RootState } from "@/store";
import { useSubjectMappingLogic } from "@/components/hopdc/hook/CloPloMappingLogic";
import { SubjectClo } from "@/services/cloplo.service";

interface CreatedSyllabusItem {
  syllabusId: string;
  syllabusName: string;
  status?: string;
  minBloomLevel: number;
  minAvgGrade: number;
  createdAt?: string;
}

type UnknownRecord = Record<string, unknown>;

export function useNewSubjectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const sprintId = searchParams.get("sprintId");

  const mappingLogic = useSubjectMappingLogic();
  const { subjectId, subject, curriculumId } = mappingLogic;

  const { data: associatedTask, isLoading: isTaskLoading } = useQuery({
    queryKey: ["associated-task", sprintId, subjectId],
    queryFn: async () => {
      if (!sprintId || !subjectId || !user?.departmentId) return null;
      const res = await TaskService.getTasksBySprintIdAndDepartmentId(
        sprintId,
        user.departmentId,
      );
      const tasks = res?.data?.content || [];
      return (
        tasks.find((t) => t.subjectId === subjectId) || null
      );
    },
    enabled: !!sprintId && !!subjectId && !!user?.departmentId,
  });

  const [activeTab, setActiveTab] = useState<
    "subject" | "mapping" | "syllabus"
  >("subject");
  const [isCreateCloModalOpen, setIsCreateCloModalOpen] = useState(false);
  const [isUpdateCloModalOpen, setIsUpdateCloModalOpen] = useState(false);
  const [cloToEdit, setCloToEdit] = useState<SubjectClo | null>(null);

  const handleCloEdit = (clo: SubjectClo) => {
    setCloToEdit(clo);
    setIsUpdateCloModalOpen(true);
  };

  const handleCloModalClose = () => {
    setIsCreateCloModalOpen(false);
  };

  const handleUpdateCloModalClose = () => {
    setIsUpdateCloModalOpen(false);
    setCloToEdit(null);
  };
  const [isCreateSyllabusModalOpen, setIsCreateSyllabusModalOpen] =
    useState(false);
  const [syllabusNotice, setSyllabusNotice] = useState<string>("");
  const [deletingSyllabusId, setDeletingSyllabusId] = useState<string | null>(
    null,
  );

  const { data: syllabusRes, isLoading: isSyllabusLoading } = useQuery({
    queryKey: ["subject-syllabi", subjectId, "DRAFT"],
    queryFn: () => SyllabusService.getSyllabiBySubject(subjectId!, "DRAFT"),
    enabled: !!subjectId,
  });

  const { data: publishedSyllabusRes, isLoading: isPublishedSyllabusLoading } = useQuery({
    queryKey: ["subject-syllabi", subjectId, "PUBLISHED"],
    queryFn: () => SyllabusService.getSyllabiBySubject(subjectId!, "PUBLISHED"),
    enabled: !!subjectId && associatedTask?.type === "REUSED_SUBJECT",
  });

  const currentSyllabusId = associatedTask?.syllabus?.syllabusId;
  const { data: currentSyllabusRes, isLoading: isCurrentSyllabusLoading } = useQuery({
    queryKey: ["syllabus", currentSyllabusId],
    queryFn: () => SyllabusService.getSyllabusById(currentSyllabusId!),
    enabled: !!currentSyllabusId,
  });

  const normalizeSyllabusItem = (
    syllabusLike: unknown,
  ): CreatedSyllabusItem => {
    const payload =
      syllabusLike && typeof syllabusLike === "object"
        ? (syllabusLike as UnknownRecord)
        : {};

    return {
      syllabusId:
        String(
          payload?.syllabusId ??
            payload?.id ??
            `${Date.now()}-${Math.random()}`,
        ) || `${Date.now()}-${Math.random()}`,
      syllabusName: String(payload?.syllabusName ?? payload?.name ?? "Unnamed"),
      status: typeof payload?.status === "string" ? payload.status : undefined,
      minBloomLevel: Number(payload?.minBloomLevel ?? 0),
      minAvgGrade: Number(payload?.minAvgGrade ?? 0),
      createdAt:
        typeof payload?.createdAt === "string" ? payload.createdAt : undefined,
    };
  };

  const normalizeSyllabusList = (
    responseLike: unknown,
  ): CreatedSyllabusItem[] => {
    const responseRecord =
      responseLike && typeof responseLike === "object"
        ? (responseLike as UnknownRecord)
        : {};

    const data = responseRecord.data;
    let list: unknown[] = [];

    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === "object") {
      const dataRecord = data as UnknownRecord;
      if (Array.isArray(dataRecord.content)) {
        list = dataRecord.content;
      } else if (Array.isArray(dataRecord.items)) {
        list = dataRecord.items;
      }
    }

    if (list.length === 0 && Array.isArray(responseRecord.content)) {
      list = responseRecord.content;
    }

    return list.map((item) => normalizeSyllabusItem(item));
  };

  const draftSyllabi = normalizeSyllabusList(syllabusRes);
  const publishedSyllabi = normalizeSyllabusList(publishedSyllabusRes);
  const publishedSyllabus = publishedSyllabi.length > 0 ? publishedSyllabi[0] : null;
  const currentSyllabus = currentSyllabusRes?.data;

  const normalizeCreatedSyllabus = (
    createdSyllabusResponse: unknown,
  ): CreatedSyllabusItem => {
    const responseRecord =
      createdSyllabusResponse && typeof createdSyllabusResponse === "object"
        ? (createdSyllabusResponse as UnknownRecord)
        : {};
    const responseData = responseRecord.data;
    const payload =
      responseData && typeof responseData === "object"
        ? (responseData as UnknownRecord)
        : responseRecord;

    return normalizeSyllabusItem(payload);
  };

  const openStandardInput = (syllabusId?: string) => {
    const resolvedSubjectId = subject?.subjectId || subjectId || "";
    if (!resolvedSubjectId) {
      return;
    }

    const params = new URLSearchParams({
      subjectId: resolvedSubjectId,
    });

    if (syllabusId) {
      params.set("syllabusId", syllabusId);
    }

    if (curriculumId) {
      params.set("curriculumId", curriculumId);
    }

    router.push(
      `/dashboard/hopdc/sprint-management/new-subject/standard-input?${params.toString()}`,
    );
  };

  const deleteSyllabus = async (syllabusId: string) => {
    if (!user?.accountId) {
      setSyllabusNotice("Missing accountId. Please login again.");
      return;
    }

    setDeletingSyllabusId(syllabusId);
    setSyllabusNotice("");

    try {
      const res = await SyllabusService.archiveSyllabusByAccount(
        syllabusId,
        user.accountId,
      );
      setSyllabusNotice(res?.message || "Syllabus archived successfully.");
      setTimeout(() => {
        setSyllabusNotice("");
      }, 5000);

      await queryClient.invalidateQueries({
        queryKey: ["subject-syllabi", subjectId, "DRAFT"],
      });
    } catch (archiveError) {
      setSyllabusNotice(
        archiveError instanceof Error
          ? archiveError.message
          : "Failed to archive syllabus.",
      );
    } finally {
      setDeletingSyllabusId(null);
    }
  };

  const handleCloModalSuccess = () => {
    setIsCreateCloModalOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["subject-clos", subjectId],
    });
  };

  const handleSyllabusModalSuccess = (createdSyllabusResponse: unknown) => {
    normalizeCreatedSyllabus(createdSyllabusResponse);
    setIsCreateSyllabusModalOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["subject-syllabi", subjectId, "DRAFT"],
    });
  };

  return {
    ...mappingLogic,
    user,
    activeTab,
    setActiveTab,
    isCreateCloModalOpen,
    setIsCreateCloModalOpen,
    isUpdateCloModalOpen,
    handleUpdateCloModalClose,
    cloToEdit,
    handleCloEdit,
    handleCloModalClose,
    hasUnsavedChanges: mappingLogic.hasUnsavedChanges,
    addedCount: mappingLogic.addedCount,
    deletedCount: mappingLogic.deletedCount,
    isCreateSyllabusModalOpen,
    setIsCreateSyllabusModalOpen,
    syllabusNotice,
    deletingSyllabusId,
    isSyllabusLoading,
    draftSyllabi,
    publishedSyllabus,
    isPublishedSyllabusLoading,
    openStandardInput,
    deleteSyllabus,
    handleCloModalSuccess,
    handleSyllabusModalSuccess,
    associatedTask,
    isTaskLoading,
    sprintId,
    currentSyllabus,
  };
}
