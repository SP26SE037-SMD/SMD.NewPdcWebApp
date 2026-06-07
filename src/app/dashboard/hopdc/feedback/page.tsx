"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Trash2,
  X,
  BarChart,
  FileText,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Major, MajorService } from "@/services/major.service";
import {
  CurriculumFramework,
  CurriculumService,
} from "@/services/curriculum.service";
import {
  FeedbackCreateQuestionPayload,
  FeedbackFormFullSchema,
  FeedbackFormQuestion,
  FeedbackFormRecord,
  FeedbackFormSchemaSection,
  FeedbackFormService,
} from "@/services/feedback-form.service";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { FeedbackSubmissions } from "./_components/FeedbackSubmissions";
import { FeedbackReport } from "./_components/FeedbackReport";

const DEFAULT_FORM_TYPES = ["MIDTERM", "FINAL", "GENERAL", "WEEKLY"];
const QUESTION_TYPES: FeedbackCreateQuestionPayload["type"][] = [
  "SHORT_TEXT",
  "PARAGRAPH",
  "RADIO",
  "CHECKBOX",
  "DROPDOWN",
  "LINEAR_SCALE",
];

type SectionAction = "NEXT" | "SUBMIT" | "GO_TO_SECTION";
type SectionEditorMode = "create" | "edit";
type QuestionEditorMode = "create" | "edit";

type QuestionOptionDraft = {
  id: string;
  optionText: string;
  nextSectionId: string;
};

type DeleteConfirmState = {
  kind: "section" | "question";
  id: string;
  message: string;
};

const createOptionDraft = (
  optionText = "",
  nextSectionId = "",
): QuestionOptionDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  optionText,
  nextSectionId,
});

const isOptionQuestionType = (
  type: FeedbackCreateQuestionPayload["type"],
): boolean => type === "RADIO" || type === "CHECKBOX" || type === "DROPDOWN";

const isValidQuestionType = (
  value: string,
): value is FeedbackCreateQuestionPayload["type"] =>
  QUESTION_TYPES.includes(value as FeedbackCreateQuestionPayload["type"]);

export default function HopdcFeedbackPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [majorId, setMajorId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [formName, setFormName] = useState(""); // Keeping this just in case, but using createFormName for modal
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMajorId, setCreateMajorId] = useState("");
  const [createCurriculumId, setCreateCurriculumId] = useState("");
  const [createFormName, setCreateFormName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const user = useSelector((state: RootState) => state.auth.user);
  const [createCurriculums, setCreateCurriculums] = useState<CurriculumFramework[]>([]);
  const [loadingCreateCurriculums, setLoadingCreateCurriculums] = useState(false);

  const [majors, setMajors] = useState<Major[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumFramework[]>([]);
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);

  const [loadingMajors, setLoadingMajors] = useState(true);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishingFormId, setPublishingFormId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const [activeMainTab, setActiveMainTab] = useState<"manage" | "designer">(
    "manage",
  );
  const [filterFormType, setFilterFormType] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [designerFormId, setDesignerFormId] = useState("");
  const [schema, setSchema] = useState<FeedbackFormFullSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const designerRef = useRef<HTMLDivElement>(null);
  const [designerHeight, setDesignerHeight] = useState<number>(0);

  // ResizeObserver to track dynamic height of designerRef card
  useEffect(() => {
    if (typeof window === "undefined") return;

    const measureHeight = () => {
      if (designerRef.current) {
        const height = designerRef.current.offsetHeight;
        if (height > 0) {
          setDesignerHeight(height);
        }
      }
    };

    // Run initial measurement immediately
    measureHeight();

    // Safety fallback: measure after entrance animations finish (350ms)
    const timer = setTimeout(measureHeight, 350);

    let observer: ResizeObserver | null = null;
    if (designerRef.current) {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.target.clientHeight || (entry.target as HTMLElement).offsetHeight;
          if (height > 0) {
            setDesignerHeight(height);
          }
        }
      });
      observer.observe(designerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [activeMainTab, selectedSectionId, schema]);

  const mainTabs = useMemo(() => {
    const tabs: { id: "manage" | "designer"; label: string }[] = [
      { id: "manage", label: "Feedback Forms" },
    ];
    if (designerFormId) {
      tabs.push({ id: "designer", label: "Form Designer" });
    }
    return tabs;
  }, [designerFormId]);

  const [sectionMode, setSectionMode] = useState<SectionEditorMode>("create");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionForm, setSectionForm] = useState<{
    title: string;
    afterSectionAction: SectionAction;
    targetSectionId: string;
  }>({
    title: "",
    afterSectionAction: "NEXT",
    targetSectionId: "",
  });

  const [questionMode, setQuestionMode] =
    useState<QuestionEditorMode>("create");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState<{
    content: string;
    type: FeedbackCreateQuestionPayload["type"] | "";
    isRequired: boolean;
  }>({
    content: "",
    type: "",
    isRequired: true,
  });
  const [questionOptions, setQuestionOptions] = useState<QuestionOptionDraft[]>(
    [],
  );
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const selectedCurriculum = useMemo(
    () => curriculums.find((item) => item.curriculumId === curriculumId),
    [curriculums, curriculumId],
  );

  const selectedSection = useMemo(
    () =>
      schema?.sections?.find(
        (section) => section.sectionId === selectedSectionId,
      ) || null,
    [schema, selectedSectionId],
  );

  const sortedAndFilteredForms = useMemo(() => {
    // 1. Sort by createdAt (based on sortOrder)
    const sorted = [...forms].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // 2. Filter by formType if not "ALL"
    if (filterFormType === "ALL") {
      return sorted;
    }
    return sorted.filter((form) => form.formType === filterFormType);
  }, [forms, filterFormType, sortOrder]);

  const dynamicFormTypes = useMemo(() => {
    const types = new Set<string>();
    forms.forEach((f) => {
      if (f.formType) {
        types.add(f.formType);
      }
    });
    return ["ALL", ...Array.from(types)];
  }, [forms]);

  const questionNeedsOptions = isOptionQuestionType(
    questionForm.type as FeedbackCreateQuestionPayload["type"],
  );

  useEffect(() => {
    if (questionNeedsOptions && questionOptions.length === 0) {
      setQuestionOptions([createOptionDraft()]);
    }
    if (!questionNeedsOptions && questionOptions.length > 0) {
      setQuestionOptions([]);
    }
  }, [questionNeedsOptions, questionOptions.length]);

  const normalizeSchema = (
    payload: any,
    fallbackFormId: string,
  ): FeedbackFormFullSchema => {
    const base = payload?.data?.sections ? payload.data : payload;
    return {
      formId: base?.formId || base?.id || fallbackFormId,
      title: base?.title,
      description: base?.description,
      sections: Array.isArray(base?.sections) ? base.sections : [],
    };
  };

  const resetSectionEditor = () => {
    setSectionMode("create");
    setEditingSectionId(null);
    setSectionForm({
      title: "",
      afterSectionAction: "NEXT",
      targetSectionId: "",
    });
  };

  const resetQuestionEditor = () => {
    setQuestionMode("create");
    setEditingQuestionId(null);
    setQuestionForm({
      content: "",
      type: "",
      isRequired: true,
    });
    setQuestionOptions([]);
  };

  const loadMajors = async () => {
    setLoadingMajors(true);
    setError(null);

    try {
      const response = await MajorService.getMajors({ page: 0, size: 100 });
      setMajors(response?.data?.content || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load majors");
      setMajors([]);
    } fillly: {
      setLoadingMajors(false);
    }
  };

  const loadCurriculums = async (nextMajorId: string) => {
    if (!nextMajorId) {
      setCurriculums([]);
      setCurriculumId("");
      return;
    }

    setLoadingCurriculums(true);
    setError(null);

    try {
      const response = (await CurriculumService.getCurriculumsByMajorId(
        nextMajorId,
      )) as any;
      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setCurriculums(items);
    } catch (err: any) {
      setError(err?.message || "Failed to load curriculums");
      setCurriculums([]);
    } finally {
      setLoadingCurriculums(false);
    }
  };

  const loadForms = async (nextCurriculumId: string) => {
    if (!nextCurriculumId) {
      setForms([]);
      return;
    }

    setLoadingForms(true);
    setError(null);

    try {
      const response = (await FeedbackFormService.getFormsByCurriculumId(
        nextCurriculumId,
      )) as any;
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setForms(items);
    } catch (err: any) {
      setError(err?.message || "Failed to load feedback forms");
      setForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  useEffect(() => {
    loadMajors();
  }, []);

  const handleMajorChange = async (value: string) => {
    setMajorId(value);
    setCurriculumId("");
    setForms([]);
    setSuccess(null);
    setFilterFormType("ALL");
    setActiveMainTab("manage");
    setDesignerFormId("");
    setSchema(null);
    await loadCurriculums(value);
  };

  const handleCurriculumChange = async (value: string) => {
    setCurriculumId(value);
    setSuccess(null);
    setFilterFormType("ALL");
    setActiveMainTab("manage");
    setDesignerFormId("");
    setSchema(null);
    await loadForms(value);
  };

  const openCreateModal = () => {
    setCreateMajorId(majorId);
    setCreateCurriculumId(curriculumId);
    setCreateFormName("");
    setCreateCurriculums(curriculums);
    setIsCreateModalOpen(true);
  };

  const handleCreateMajorChange = async (value: string) => {
    setCreateMajorId(value);
    setCreateCurriculumId("");
    if (!value) {
      setCreateCurriculums([]);
      return;
    }
    setLoadingCreateCurriculums(true);
    try {
      const response = (await CurriculumService.getCurriculumsByMajorId(value)) as any;
      const items = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setCreateCurriculums(items);
    } catch (err) {
      setCreateCurriculums([]);
    } finally {
      setLoadingCreateCurriculums(false);
    }
  };

  const handleCreateFeedback = async () => {
    const resolvedFormName = createFormName.trim();
    const resolvedDescription = createDescription.trim();

    if (!resolvedFormName) {
      setError("Please enter form name.");
      return;
    }

    if (!user?.accountId) {
      setError("User account not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get departmentId
      const { AccountService } = await import('@/services/account.service');
      const accountRes = await AccountService.getAccountById(user.accountId);
      const departmentId = accountRes?.data?.departmentId;

      if (!departmentId) {
         setError("Department ID not found for current user.");
         setSubmitting(false);
         return;
      }

      const created = await FeedbackFormService.createForm({
        formName: resolvedFormName,
        description: resolvedDescription,
        departmentId: departmentId,
      } as any); // Using as any since payload shape might slightly differ locally
      
      setSuccess(`Feedback form created: ${created.id}`);
      showToast(`Feedback form created: ${created.id}`, "success");
      
      setIsCreateModalOpen(false);
      setCreateFormName("");
      setCreateDescription("");
      
      // Navigate to designer
      router.push(`/dashboard/hopdc/feedback/${created.id}/design`);
      
    } catch (err: any) {
      const message = err?.message || "Failed to create feedback form";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (targetFormId: string) => {
    setPublishingFormId(targetFormId);
    setError(null);
    setSuccess(null);

    try {
      const response = await FeedbackFormService.triggerBuild(targetFormId);
      setSuccess(response?.message || "Publish request sent successfully.");
      showToast(
        response?.message || "Publish request sent successfully.",
        "success",
      );
      await loadForms(curriculumId);
    } catch (err: any) {
      const message = err?.message || "Failed to publish feedback form";
      setError(message);
      showToast(message, "error");
    } finally {
      setPublishingFormId(null);
    }
  };

  const loadDesignerSchema = async (inputFormId?: string) => {
    const targetFormId = (inputFormId || designerFormId).trim();
    if (!targetFormId) {
      setError("Please enter form id to load schema.");
      return;
    }

    setLoadingSchema(true);
    setError(null);

    try {
      const response =
        await FeedbackFormService.getFormFullSchema(targetFormId);
      const normalizedSchema = normalizeSchema(response as any, targetFormId);

      setDesignerFormId(targetFormId);
      setSchema(normalizedSchema);
      setSelectedSectionId((prev) => {
        if (
          prev &&
          normalizedSchema.sections.some(
            (section) => section.sectionId === prev,
          )
        ) {
          return prev;
        }
        return normalizedSchema.sections[0]?.sectionId || "";
      });

      if (
        editingSectionId &&
        !normalizedSchema.sections.some(
          (section) => section.sectionId === editingSectionId,
        )
      ) {
        resetSectionEditor();
      }

      if (editingQuestionId) {
        const stillExists = normalizedSchema.sections.some((section) =>
          (section.questions || []).some(
            (question) => question.questionId === editingQuestionId,
          ),
        );

        if (!stillExists) {
          resetQuestionEditor();
        }
      }

      showToast("Form schema loaded.", "success");
    } catch (err: any) {
      setSchema(null);
      setSelectedSectionId("");
      setError(err?.message || "Failed to load form schema");
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleOpenDesigner = (formId: string) => {
    router.push(`/dashboard/hopdc/feedback/${formId}/design`);
  };

  const handleEditSection = (section: FeedbackFormSchemaSection) => {
    setSectionMode("edit");
    setEditingSectionId(section.sectionId);
    setSectionForm({
      title: section.title || "",
      afterSectionAction:
        section.actionAfter || section.afterSectionAction || "NEXT",
      targetSectionId: section.targetSectionId || "",
    });
    setSuccess(null);
  };

  const handleSaveSection = async () => {
    const targetFormId = designerFormId.trim();
    if (!targetFormId) {
      setError("Please enter form id before saving section.");
      return;
    }

    if (sectionMode === "edit" && !editingSectionId) {
      setError("Missing section id for editing.");
      return;
    }

    if (
      sectionForm.afterSectionAction === "GO_TO_SECTION" &&
      !sectionForm.targetSectionId.trim()
    ) {
      setError("Target section id is required for GO_TO_SECTION action.");
      return;
    }

    setAddingSection(true);
    setError(null);

    try {
      const payload: {
        title?: string;
        afterSectionAction?: SectionAction;
        targetSectionId?: string | null;
      } = {
        afterSectionAction: sectionForm.afterSectionAction,
      };

      if (sectionForm.title.trim()) {
        payload.title = sectionForm.title.trim();
      }

      payload.targetSectionId =
        sectionForm.afterSectionAction === "GO_TO_SECTION"
          ? sectionForm.targetSectionId.trim() || null
          : null;

      if (sectionMode === "edit" && editingSectionId) {
        await FeedbackFormService.updateSection(editingSectionId, payload);
      } else {
        await FeedbackFormService.createSection(targetFormId, payload);
      }

      resetSectionEditor();
      await loadDesignerSchema(targetFormId);
      const message =
        sectionMode === "edit"
          ? "Section updated successfully."
          : "Section added successfully.";
      setSuccess(message);
      showToast(message, "success");
    } catch (err: any) {
      const message =
        err?.message ||
        (sectionMode === "edit"
          ? "Failed to update section"
          : "Failed to add section");
      setError(message);
      showToast(message, "error");
    } finally {
      setAddingSection(false);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setDeleteConfirm({
      kind: "section",
      id: sectionId,
      message: "Delete this section and all of its questions?",
    });
  };

  const addQuestionOption = () => {
    setQuestionOptions((prev) => [...prev, createOptionDraft()]);
  };

  const updateQuestionOption = (
    optionId: string,
    field: "optionText" | "nextSectionId",
    value: string,
  ) => {
    setQuestionOptions((prev) =>
      prev.map((option) =>
        option.id === optionId ? { ...option, [field]: value } : option,
      ),
    );
  };

  const removeQuestionOption = (optionId: string) => {
    setQuestionOptions((prev) =>
      prev.filter((option) => option.id !== optionId),
    );
  };

  const handleEditQuestion = (question: FeedbackFormQuestion) => {
    const safeType = isValidQuestionType(question.type)
      ? question.type
      : "TEXT";

    setQuestionMode("edit");
    setEditingQuestionId(question.questionId);
    setQuestionForm({
      content: question.content || "",
      type: safeType,
      isRequired: question.isRequired ?? true,
    });

    if (isOptionQuestionType(safeType)) {
      const mappedOptions = (question.options || [])
        .map((option) => {
          const optionText = (option.optionText || option.text || "").trim();
          const nextSectionId =
            (option.nextSectionId || option.goToSectionId || "")?.toString() ||
            "";
          return optionText
            ? createOptionDraft(optionText, nextSectionId)
            : null;
        })
        .filter(Boolean) as QuestionOptionDraft[];

      setQuestionOptions(
        mappedOptions.length > 0 ? mappedOptions : [createOptionDraft()],
      );
    } else {
      setQuestionOptions([]);
    }

    setSuccess(null);
  };

  const buildQuestionOptionsPayload = () =>
    questionOptions
      .map((option) => {
        const optionText = option.optionText.trim();
        const nextSectionId = option.nextSectionId.trim();

        if (!optionText) {
          return null;
        }

        return {
          optionText,
          nextSectionId: nextSectionId || null,
        };
      })
      .filter(Boolean) as Array<{
        optionText: string;
        nextSectionId?: string | null;
      }>;

  const handleSaveQuestion = async () => {
    if (!selectedSectionId) {
      setError("Please select a section before saving question.");
      return;
    }

    if (!questionForm.content.trim()) {
      setError("Question content is required.");
      return;
    }

    if (!questionForm.type) {
      setError("Please choose a question type.");
      return;
    }

    if (questionMode === "edit" && !editingQuestionId) {
      setError("Missing question id for editing.");
      return;
    }

    const optionsPayload = questionNeedsOptions
      ? buildQuestionOptionsPayload()
      : [];

    if (questionNeedsOptions && optionsPayload.length === 0) {
      setError("Please add at least one option for selected question type.");
      return;
    }

    setAddingQuestion(true);
    setError(null);

    try {
      const payload: FeedbackCreateQuestionPayload = {
        content: questionForm.content.trim(),
        type: questionForm.type,
        isRequired: questionForm.isRequired,
      };

      if (questionNeedsOptions) {
        payload.options = optionsPayload;
      }

      if (questionMode === "edit" && editingQuestionId) {
        await FeedbackFormService.updateQuestion(editingQuestionId, payload);
      } else {
        await FeedbackFormService.createQuestion(selectedSectionId, payload);
      }

      resetQuestionEditor();
      await loadDesignerSchema(designerFormId);
      const message =
        questionMode === "edit"
          ? "Question updated successfully."
          : "Question added successfully.";
      setSuccess(message);
      showToast(message, "success");
    } catch (err: any) {
      const message =
        err?.message ||
        (questionMode === "edit"
          ? "Failed to update question"
          : "Failed to add question");
      setError(message);
      showToast(message, "error");
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setDeleteConfirm({
      kind: "question",
      id: questionId,
      message: "Delete this question?",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      if (deleteConfirm.kind === "section") {
        await FeedbackFormService.deleteSection(deleteConfirm.id);
        if (editingSectionId === deleteConfirm.id) {
          resetSectionEditor();
        }
      } else {
        await FeedbackFormService.deleteQuestion(deleteConfirm.id);
        if (editingQuestionId === deleteConfirm.id) {
          resetQuestionEditor();
        }
      }

      await loadDesignerSchema(designerFormId);

      const message =
        deleteConfirm.kind === "section"
          ? "Section deleted successfully."
          : "Question deleted successfully.";

      setSuccess(message);
      showToast(message, "success");
      setDeleteConfirm(null);
    } catch (err: any) {
      const message =
        err?.message ||
        (deleteConfirm.kind === "section"
          ? "Failed to delete section"
          : "Failed to delete question");
      setError(message);
      showToast(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-8 p-4">
      <div
        className={`mx-auto pt-12 pb-12 px-6 transition-all duration-500 ${activeMainTab === "designer" ? "max-w-7xl xl:max-w-[1500px]" : "max-w-6xl"
          }`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5"
        >
          <div>
            <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent pb-1">
              Feedback Center
            </h1>
            <p className="text-on-surface-variant text-base max-w-xl">
              Create and manage feedback forms by selecting major, then
              curriculum.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02] hover:bg-primary/90 hover:shadow-primary/40 active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" />
              Create Form
            </button>
            <button
              onClick={() => {
                if (curriculumId) {
                  loadForms(curriculumId);
                }
              }}
              disabled={!curriculumId || loadingForms}
              className="inline-flex items-center gap-2 rounded-2xl border border-outline/30 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loadingForms ? "animate-spin" : ""}`}
              />
              Refresh Forms
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-outline/20 bg-surface/40 shadow-xl shadow-black/5 backdrop-blur-2xl mb-6 flex flex-col"
        >
          {/* Top section: Configuration */}
          <div className="p-5 md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-outline/10 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  Configuration
                </span>
                <h2 className="text-lg font-bold text-on-surface mt-0.5">
                  Select Major & Curriculum
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Major
                </label>
                <select
                  value={majorId}
                  onChange={(e) => handleMajorChange(e.target.value)}
                  disabled={loadingMajors}
                  className="w-full rounded-xl border border-outline/20 bg-white/70 px-4 py-3 text-[15px] font-semibold text-on-surface outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
                >
                  <option value="">
                    {loadingMajors ? "Loading majors..." : "Select major"}
                  </option>
                  {majors.map((major) => (
                    <option key={major.majorId} value={major.majorId}>
                      {major.majorCode} - {major.majorName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Curriculum
                </label>
                <select
                  value={curriculumId}
                  onChange={(e) => handleCurriculumChange(e.target.value)}
                  disabled={!majorId || loadingCurriculums}
                  className="w-full rounded-xl border border-outline/20 bg-white/70 px-4 py-3 text-[15px] font-semibold text-on-surface outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
                >
                  <option value="">
                    {loadingCurriculums
                      ? "Loading curriculums..."
                      : "Select curriculum"}
                  </option>
                  {curriculums.map((curriculum) => (
                    <option
                      key={curriculum.curriculumId}
                      value={curriculum.curriculumId}
                    >
                      {curriculum.curriculumCode} - {curriculum.curriculumName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCurriculum && (
              <div className="mt-4 rounded-xl border border-outline/10 bg-surface-container-lowest/90 px-4 py-3.5 text-sm font-bold text-on-surface-variant shadow-inner flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/10 shadow-xs">
                  Selected
                </span>
                <span>
                  {selectedCurriculum.curriculumCode} -{" "}
                  {selectedCurriculum.curriculumName}
                </span>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-outline/10" />

          {/* Disabled overlay when no curriculum selected */}
          <div className={`p-5 md:p-8 transition-all duration-300 ${!curriculumId ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            <>

              {activeMainTab === "manage" && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex flex-col"
                  >
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-outline/10 pb-4">
                      <div className="flex flex-wrap items-center gap-3.5">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-primary">
                            Management
                          </span>
                          <h2 className="text-xl font-bold text-on-surface mt-1 flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Feedback Forms
                          </h2>
                        </div>
                        {forms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex items-center">
                              <Filter className="absolute left-3 h-3.5 w-3.5 text-on-surface-variant/60 pointer-events-none" />
                              <select
                                value={filterFormType}
                                onChange={(e) => setFilterFormType(e.target.value)}
                                className="rounded-xl border border-outline/20 bg-white/70 pl-9 pr-3 py-1.5 text-xs font-bold text-on-surface-variant outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                              >
                                {dynamicFormTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type === "ALL"
                                      ? "All Types"
                                      : type === "MIDTERM"
                                        ? "Midterm"
                                        : type === "FINAL"
                                          ? "Final"
                                          : type === "WEEKLY"
                                            ? "Weekly"
                                            : type}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="relative flex items-center">
                              <ArrowUpDown className="absolute left-3 h-3.5 w-3.5 text-on-surface-variant/60 pointer-events-none" />
                              <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                                className="rounded-xl border border-outline/20 bg-white/70 pl-9 pr-3 py-1.5 text-xs font-bold text-on-surface-variant outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                              >
                                <option value="desc">Date: Newest (DESC)</option>
                                <option value="asc">Date: Oldest (ASC)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        {sortedAndFilteredForms.length === forms.length
                          ? `${forms.length} forms`
                          : `Showing ${sortedAndFilteredForms.length} of ${forms.length} forms`}
                      </span>
                    </div>

                    {loadingForms ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Loading forms...</p>
                      </div>
                    ) : !curriculumId ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline/30 py-14 text-center text-on-surface-variant">
                        <ClipboardList className="h-8 w-8 text-outline" />
                        <p className="text-sm font-semibold">
                          Choose a curriculum to view forms.
                        </p>
                      </div>
                    ) : forms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline/30 py-14 text-center text-on-surface-variant">
                        <ClipboardList className="h-8 w-8 text-outline" />
                        <p className="text-sm font-semibold">
                          No feedback forms found for this curriculum.
                        </p>
                      </div>
                    ) : (
                      <>
                        {sortedAndFilteredForms.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline/30 py-14 text-center text-on-surface-variant">
                            <ClipboardList className="h-8 w-8 text-outline" />
                            <p className="text-sm font-semibold">
                              No feedback forms match this type filter.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {sortedAndFilteredForms.map((form) => (
                              <div
                                key={form.id}
                                className="group bg-white/60 hover:bg-white border border-outline/10 transition-all duration-300 shadow-sm hover:shadow-md rounded-2xl p-5 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>

                                      <p className="mt-1 break-all text-sm font-bold text-on-surface group-hover:text-primary transition-colors duration-300">
                                        {form.formType}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {form.formUrl && (
                                        <a
                                          href={form.formUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white active:scale-95 shadow-sm"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          Open Form
                                        </a>
                                      )}

                                      <span
                                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${form.isActive
                                            ? "bg-primary/10 text-primary"
                                            : "bg-surface-container-highest text-on-surface-variant"
                                          }`}
                                      >
                                        {form.isActive ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <FileText className="h-3 w-3" />
                                        )}
                                        {form.isActive ? "ACTIVE" : "DRAFT"}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs font-semibold text-on-surface-variant/60">
                                    Created at: {formatDate(form.createdAt)}
                                  </p>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                  {form.editFormURL && (
                                    <a
                                      href={form.editFormURL}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white active:scale-95"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit Form
                                    </a>
                                  )}

                                  <button
                                    onClick={() => handleOpenDesigner(form.id)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white active:scale-95"
                                  >
                                    <ListTree className="h-3.5 w-3.5" />
                                    Design
                                  </button>

                                  {form.isActive && (
                                    <button
                                      onClick={() =>
                                        router.push(`/dashboard/hopdc/feedback/${form.id}/results`)
                                      }
                                      className="inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-secondary to-secondary/80 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-secondary/10 transition duration-300 hover:scale-105 active:scale-95"
                                    >
                                      <BarChart className="h-3.5 w-3.5" />
                                      View Results
                                    </button>
                                  )}
                                  {!form.isActive && (
                                    <button
                                      onClick={() => handlePublish(form.id)}
                                      disabled={publishingFormId === form.id}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-primary to-primary/80 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-primary/10 transition duration-300 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {publishingFormId === form.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Send className="h-3.5 w-3.5" />
                                      )}
                                      Publish
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </>
              )}

            </>
          </div>
        </motion.div>

        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => {
              if (!deleting) {
                setDeleteConfirm(null);
              }
            }}
          >
            <div
              className="w-full max-w-xl rounded-3xl border border-outline/20 bg-surface p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h4 className="text-xl font-bold text-on-surface">
                Confirm Delete
              </h4>
              <p className="mt-2 text-sm text-on-surface-variant">
                {deleteConfirm.message}
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-xl border border-outline/20 bg-surface px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-error px-4 py-2 text-sm font-semibold text-on-error transition hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isCreateModalOpen && typeof document !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => !submitting && setIsCreateModalOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-outline/20 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b border-outline/10 pb-4">
                <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Create New Feedback Form
                </h3>
                <button
                  onClick={() => !submitting && setIsCreateModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface transition hover:bg-surface-container p-1 rounded-full"
                  disabled={submitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Form Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Pencil className="h-4.5 w-4.5 text-primary/60" />
                    </div>
                    <input
                      value={createFormName}
                      onChange={(e) => setCreateFormName(e.target.value)}
                      disabled={submitting}
                      placeholder="e.g., Midterm Evaluation, Alumni Survey..."
                      className="w-full rounded-2xl border border-outline/20 bg-white/70 pl-11 pr-4 py-3.5 text-[15px] font-semibold text-on-surface outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/15 shadow-sm placeholder:font-medium placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Description
                  </label>
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    disabled={submitting}
                    placeholder="Briefly describe the purpose of this feedback form..."
                    rows={4}
                    className="w-full rounded-2xl border border-outline/20 bg-white/70 p-4 text-[15px] font-semibold text-on-surface outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/15 shadow-sm placeholder:font-medium placeholder:text-on-surface-variant/50 resize-none"
                  />
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => !submitting && setIsCreateModalOpen(false)}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFeedback}
                    disabled={submitting || !createFormName.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-primary to-primary/80 px-8 py-2.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02] hover:shadow-primary/40 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                    Create Form
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
