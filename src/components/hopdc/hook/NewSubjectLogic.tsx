"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { SyllabusService } from "@/services/syllabus.service";
import { TaskService } from "@/services/task.service";
import { RootState } from "@/store";
import { useSubjectMappingLogic } from "@/components/hopdc/hook/CloPloMappingLogic";
import { SubjectClo } from "@/services/cloplo.service";
import { SubjectDetail } from "@/services/subject.service";

interface CreatedSyllabusItem {
  syllabusId: string;
  syllabusName: string;
  status?: string;
  minBloomLevel: number;
  minAvgMarkToPass?: number;
  createdAt?: string;
}

type UnknownRecord = Record<string, unknown>;

export function useNewSubjectLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const sprintId = searchParams.get("sprintId");
  const taskId = searchParams.get("taskId");
  const syllabusIdParam = searchParams.get("syllabusId");

  const mappingLogic = useSubjectMappingLogic();
  const { subjectId, subject, curriculumId } = mappingLogic;

  // Fetch the specific task directly using taskId from URL
  const { data: associatedTask, isLoading: isTaskLoading } = useQuery({
    queryKey: ["associated-task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await TaskService.getTaskById(taskId);
      return res?.data || null;
    },
    enabled: !!taskId,
  });

  const tabParam = searchParams.get("tab") as "subject" | "mapping" | "syllabus" | null;
  const activeTab = tabParam || "subject";
  const isSyllabusMode = activeTab === "syllabus";

  const setActiveTab = (tab: "subject" | "mapping" | "syllabus") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };
  const [isCreateCloModalOpen, setIsCreateCloModalOpen] = useState(false);
  const [isUpdateCloModalOpen, setIsUpdateCloModalOpen] = useState(false);
  const [isImportClosModalOpen, setIsImportClosModalOpen] = useState(false);
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

  const currentSyllabusId = (syllabusIdParam && syllabusIdParam !== "null")
    ? syllabusIdParam
    : (associatedTask?.syllabus?.syllabusId || associatedTask?.targetId);
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
      minAvgMarkToPass: Number(payload?.minAvgMarkToPass ?? payload?.minAvgGrade ?? 0),
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

  const { clos } = mappingLogic;
  const hasDraftClos = clos.some(
    (clo: any) => (clo.status || "").toUpperCase() === "DRAFT",
  );

  const isCloStructureReadOnly =
    (associatedTask?.type === "SUBJECT" && associatedTask?.action === "UPDATE") ||
    (clos.length > 0 && !hasDraftClos);
  const isMappingReadOnly = false; // Always allow mapping for now as per user request

  const isMockMode = searchParams.get("mock") === "true";

  const result = {
    ...mappingLogic,
    user,
    activeTab,
    setActiveTab,
    isCreateCloModalOpen,
    setIsCreateCloModalOpen,
    isUpdateCloModalOpen,
    isImportClosModalOpen,
    setIsImportClosModalOpen,
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
    currentSyllabusId,
    isCloStructureReadOnly,
    isMappingReadOnly,
    isSyllabusMode,
  };

  if (isMockMode) {
    return {
      ...result,
      isTaskLoading: false,
      isSyllabusLoading: false,
      isPublishedSyllabusLoading: false,
      associatedTask: {
        taskId: "mock-task-1",
        taskName: "CREATE SYLLABUS: Graphic Design Advanced",
        status: "IN_PROGRESS",
        type: "NEW_SUBJECT",
        syllabus: {
          syllabusId: "mock-id",
          syllabusName: "Thiết kế đồ họa nâng cao - 2024",
          status: "PENDING_REVIEW"
        }
      },
      currentSyllabusId: "mock-id",
      currentSyllabus: {
        syllabusId: "mock-id",
        status: "PENDING_REVIEW",
        syllabusName: "Thiết kế đồ họa nâng cao - 2024",
      },
      publishedSyllabus: null,
      sprintId: sprintId || "mock-sprint-id",
      subject: {
        subjectId: subjectId || "mock-subject-id",
        subjectCode: "GRD301",
        subjectName: "Graphic Design Advanced",
        minBloomLevel: 0,
      } as any as SubjectDetail
    };
  }

  return result;
}
