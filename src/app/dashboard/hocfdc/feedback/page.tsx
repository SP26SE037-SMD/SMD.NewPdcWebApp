"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const DEFAULT_FORM_TYPES = ["MIDTERM", "FINAL", "GENERAL", "WEEKLY"];
const QUESTION_TYPES: FeedbackCreateQuestionPayload["type"][] = [
  "TEXT",
  "SHORT_TEXT",
  "PARAGRAPH",
  "RADIO",
  "CHECKBOX",
  "DROPDOWN",
  "SCALE",
  "LINEAR_SCALE",
  "DATE",
  "TIME",
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

export default function HocfdcFeedbackPage() {
  const { showToast } = useToast();
  const [majorId, setMajorId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [formType, setFormType] = useState("GENERAL");
  const [customFormType, setCustomFormType] = useState("");

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

  const [designerFormId, setDesignerFormId] = useState("");
  const [schema, setSchema] = useState<FeedbackFormFullSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState("");

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

  const [questionMode, setQuestionMode] = useState<QuestionEditorMode>("create");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState<{
    content: string;
    type: FeedbackCreateQuestionPayload["type"];
    isRequired: boolean;
  }>({
    content: "",
    type: "TEXT",
    isRequired: true,
  });
  const [questionOptions, setQuestionOptions] = useState<QuestionOptionDraft[]>([]);
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
      schema?.sections?.find((section) => section.sectionId === selectedSectionId) ||
      null,
    [schema, selectedSectionId],
  );

  const questionNeedsOptions = isOptionQuestionType(questionForm.type);

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
      type: "TEXT",
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
    } finally {
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
    await loadCurriculums(value);
  };

  const handleCurriculumChange = async (value: string) => {
    setCurriculumId(value);
    setSuccess(null);
    await loadForms(value);
  };

  const handleCreateFeedback = async () => {
    const resolvedFormType =
      formType === "CUSTOM" ? customFormType.trim() : formType;

    if (!majorId || !curriculumId) {
      setError("Please choose major and curriculum before creating feedback.");
      return;
    }

    if (!resolvedFormType) {
      setError("Please choose or enter form type.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await FeedbackFormService.createForm({
        curriculumId,
        formType: resolvedFormType,
      });
      setSuccess(`Feedback form created: ${created.id}`);
      showToast(`Feedback form created: ${created.id}`, "success");
      setCustomFormType("");
      await loadForms(curriculumId);
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
      showToast(response?.message || "Publish request sent successfully.", "success");
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
      const response = await FeedbackFormService.getFormFullSchema(targetFormId);
      const normalizedSchema = normalizeSchema(response as any, targetFormId);

      setDesignerFormId(targetFormId);
      setSchema(normalizedSchema);
      setSelectedSectionId((prev) => {
        if (
          prev &&
          normalizedSchema.sections.some((section) => section.sectionId === prev)
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

      setSuccess("Form schema loaded.");
    } catch (err: any) {
      setSchema(null);
      setSelectedSectionId("");
      setError(err?.message || "Failed to load form schema");
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleOpenDesigner = async (formId: string) => {
    setDesignerFormId(formId);
    await loadDesignerSchema(formId);
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
    setQuestionOptions((prev) => prev.filter((option) => option.id !== optionId));
  };

  const handleEditQuestion = (question: FeedbackFormQuestion) => {
    const safeType = isValidQuestionType(question.type) ? question.type : "TEXT";

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
            (option.nextSectionId || option.goToSectionId || "")?.toString() || "";
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

    if (questionMode === "edit" && !editingQuestionId) {
      setError("Missing question id for editing.");
      return;
    }

    const optionsPayload = questionNeedsOptions ? buildQuestionOptionsPayload() : [];

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
    return date.toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-8 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Feedback Center
          </h1>
          <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
            Create and manage feedback forms by selecting major, then curriculum.
          </p>
        </div>

        <button
          onClick={() => {
            if (curriculumId) {
              loadForms(curriculumId);
            }
          }}
          disabled={!curriculumId || loadingForms}
          className="inline-flex items-center gap-2 rounded-2xl border border-outline/30 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw
            className={`h-4 w-4 ${loadingForms ? "animate-spin" : ""}`}
          />
          Refresh Forms
        </button>
      </motion.div>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-outline/20 bg-surface/40 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl"
      >
        <h2 className="mb-4 text-lg font-bold text-on-surface">Create Feedback</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Step 1 - Major
            </label>
            <select
              value={majorId}
              onChange={(e) => handleMajorChange(e.target.value)}
              disabled={loadingMajors}
              className="w-full rounded-xl border border-outline/20 bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Step 2 - Curriculum
            </label>
            <select
              value={curriculumId}
              onChange={(e) => handleCurriculumChange(e.target.value)}
              disabled={!majorId || loadingCurriculums}
              className="w-full rounded-xl border border-outline/20 bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {loadingCurriculums
                  ? "Loading curriculums..."
                  : "Select curriculum"}
              </option>
              {curriculums.map((curriculum) => (
                <option key={curriculum.curriculumId} value={curriculum.curriculumId}>
                  {curriculum.curriculumCode} - {curriculum.curriculumName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Step 3 - Form Type
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full rounded-xl border border-outline/20 bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              {DEFAULT_FORM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "MIDTERM" ? "Midterm" : type === "FINAL" ? "Final" : type === "GENERAL" ? "General" : type === "WEEKLY" ? "Weekly" : type}
                </option>
              ))}
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreateFeedback}
              disabled={submitting || !curriculumId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Create Feedback
            </button>
          </div>
        </div>

        {formType === "CUSTOM" && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Custom Form Type
            </label>
            <input
              value={customFormType}
              onChange={(e) => setCustomFormType(e.target.value)}
              placeholder="Example: ALUMNI_2026"
              className="w-full rounded-xl border border-outline/20 bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        )}

        {selectedCurriculum && (
          <div className="mt-4 rounded-2xl border border-outline/20 bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
            Selected curriculum: {selectedCurriculum.curriculumCode} - {" "}
            {selectedCurriculum.curriculumName}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border border-outline/20 bg-surface/40 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Feedback Forms</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {forms.length} forms
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
            <p className="text-sm font-semibold">Choose a curriculum to view forms.</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline/30 py-14 text-center text-on-surface-variant">
            <ClipboardList className="h-8 w-8 text-outline" />
            <p className="text-sm font-semibold">No feedback forms found for this curriculum.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {forms.map((form) => (
              <div
                key={form.id}
                className="rounded-2xl border border-outline/20 bg-surface p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      {form.formType}
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-on-surface">
                      {form.id}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      form.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    {form.isActive ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5" />
                    )}
                    {form.isActive ? "ACTIVE" : "DRAFT"}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant">
                  Created at: {formatDate(form.createdAt)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {form.editFormURL && (
                    <a
                      href={form.editFormURL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-outline/20 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Form
                    </a>
                  )}

                  {form.formUrl && (
                    <a
                      href={form.formUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-outline/20 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Form
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenDesigner(form.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-outline/20 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container"
                  >
                    <ListTree className="h-3.5 w-3.5" />
                    Design
                  </button>

                  {!form.isActive && (
                    <button
                      onClick={() => handlePublish(form.id)}
                      disabled={publishingFormId === form.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border border-outline/20 bg-surface/40 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Form Designer</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Load form schema, then create, edit, or delete sections and questions.
            </p>
          </div>

          {schema?.formId && (
            <span className="rounded-lg bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface-variant">
              Active form: {schema.formId}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={designerFormId}
            onChange={(e) => setDesignerFormId(e.target.value)}
            placeholder="Enter form id for design"
            className="w-full rounded-xl border border-outline/20 bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
          <button
            onClick={() => loadDesignerSchema()}
            disabled={loadingSchema || !designerFormId.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline/20 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSchema ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Load Schema
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-outline/20 bg-surface p-4">
            <h3 className="mb-3 text-sm font-bold text-on-surface">Sections</h3>

            {loadingSchema ? (
              <div className="flex items-center gap-2 py-3 text-sm text-on-surface-variant">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sections...
              </div>
            ) : schema?.sections?.length ? (
              <div className="space-y-2">
                {schema.sections.map((section, index) => {
                  const isActive = selectedSectionId === section.sectionId;
                  const questionCount = section.questions?.length || 0;

                  return (
                    <div
                      key={section.sectionId}
                      className={`rounded-xl border px-3 py-2 transition ${
                        isActive
                          ? "border-primary/40 bg-primary/5"
                          : "border-outline/20 bg-surface hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => setSelectedSectionId(section.sectionId)}
                          className="flex-1 text-left"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            Section {index + 1}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {section.title || "Untitled section"}
                          </p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Action: {section.actionAfter || section.afterSectionAction || "NEXT"}
                            {" | "}
                            {questionCount} question(s)
                          </p>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSection(section)}
                            className="rounded-md border border-outline/20 p-1.5 text-on-surface-variant transition hover:bg-surface"
                            title="Edit section"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section.sectionId)}
                            className="rounded-md border border-error/20 p-1.5 text-error transition hover:bg-error/10"
                            title="Delete section"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-outline/30 py-6 text-center text-sm text-on-surface-variant">
                No sections found. Add your first section below.
              </div>
            )}

            <div className="mt-4 space-y-3 rounded-xl border border-outline/20 bg-surface-container-lowest p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {sectionMode === "edit" ? "Edit Section" : "Add Section"}
                </h4>

                {sectionMode === "edit" && (
                  <button
                    onClick={resetSectionEditor}
                    className="inline-flex items-center gap-1 rounded-md border border-outline/20 px-2 py-1 text-[11px] font-semibold text-on-surface-variant transition hover:bg-surface"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                )}
              </div>

              <input
                value={sectionForm.title}
                onChange={(e) =>
                  setSectionForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Section title"
                className="w-full rounded-lg border border-outline/20 bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary/40"
              />

              <select
                value={sectionForm.afterSectionAction}
                onChange={(e) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    afterSectionAction: e.target.value as SectionAction,
                  }))
                }
                className="w-full rounded-lg border border-outline/20 bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary/40"
              >
                <option value="NEXT">Next Section</option>
                <option value="SUBMIT">Submit Form</option>
                <option value="GO_TO_SECTION">Go to Section</option>
              </select>

              {sectionForm.afterSectionAction === "GO_TO_SECTION" && (
                <input
                  value={sectionForm.targetSectionId}
                  onChange={(e) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      targetSectionId: e.target.value,
                    }))
                  }
                  placeholder="Target section id"
                  className="w-full rounded-lg border border-outline/20 bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary/40"
                />
              )}

              <button
                onClick={handleSaveSection}
                disabled={addingSection || !designerFormId.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingSection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : sectionMode === "edit" ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {sectionMode === "edit" ? "Save Section" : "Add Section"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-outline/20 bg-surface p-4">
            <h3 className="mb-3 text-sm font-bold text-on-surface">
              Questions {selectedSection ? `- ${selectedSection.title || "Selected section"}` : ""}
            </h3>

            {selectedSection ? (
              <>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {(selectedSection.questions || []).length > 0 ? (
                    (selectedSection.questions || []).map((question, index) => (
                      <div
                        key={question.questionId}
                        className="rounded-xl border border-outline/20 bg-surface-container-lowest p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            Question {index + 1}
                          </p>

                          <div className="flex items-center gap-1">
                            <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                              {question.type}
                            </span>
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="rounded-md border border-outline/20 p-1.5 text-on-surface-variant transition hover:bg-surface"
                              title="Edit question"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.questionId)}
                              className="rounded-md border border-error/20 p-1.5 text-error transition hover:bg-error/10"
                              title="Delete question"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-on-surface">
                          {question.content}
                        </p>

                        {!!question.options?.length && (
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Options: {question.options
                              .map((opt) => opt.text || opt.optionText)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-outline/30 py-6 text-center text-sm text-on-surface-variant">
                      No questions yet. Add the first question below.
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3 rounded-xl border border-outline/20 bg-surface-container-lowest p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {questionMode === "edit" ? "Edit Question" : "Add Question"}
                    </h4>

                    {questionMode === "edit" && (
                      <button
                        onClick={resetQuestionEditor}
                        className="inline-flex items-center gap-1 rounded-md border border-outline/20 px-2 py-1 text-[11px] font-semibold text-on-surface-variant transition hover:bg-surface"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    )}
                  </div>

                  <input
                    value={questionForm.content}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Question content"
                    className="w-full rounded-lg border border-outline/20 bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary/40"
                  />

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <select
                      value={questionForm.type}
                      onChange={(e) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          type: e.target.value as FeedbackCreateQuestionPayload["type"],
                        }))
                      }
                      className="w-full rounded-lg border border-outline/20 bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary/40"
                    >
                      {QUESTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    <label className="inline-flex items-center gap-2 rounded-lg border border-outline/20 bg-surface px-3 py-2 text-sm text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={questionForm.isRequired}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            isRequired: e.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      Required
                    </label>
                  </div>

                  {questionNeedsOptions && (
                    <div className="space-y-2 rounded-lg border border-outline/20 bg-surface p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                          Options
                        </p>
                        <button
                          onClick={addQuestionOption}
                          className="inline-flex items-center gap-1 rounded-md border border-outline/20 px-2 py-1 text-[11px] font-semibold text-on-surface-variant transition hover:bg-surface-container"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Option
                        </button>
                      </div>

                      {questionOptions.map((option, index) => (
                        <div
                          key={option.id}
                          className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                        >
                          <input
                            value={option.optionText}
                            onChange={(e) =>
                              updateQuestionOption(
                                option.id,
                                "optionText",
                                e.target.value,
                              )
                            }
                            placeholder={`Option ${index + 1}`}
                            className="w-full rounded-md border border-outline/20 bg-surface-container-lowest px-3 py-2 text-sm outline-none transition focus:border-primary/40"
                          />

                          <input
                            value={option.nextSectionId}
                            onChange={(e) =>
                              updateQuestionOption(
                                option.id,
                                "nextSectionId",
                                e.target.value,
                              )
                            }
                            placeholder="Next section id (optional)"
                            className="w-full rounded-md border border-outline/20 bg-surface-container-lowest px-3 py-2 text-sm outline-none transition focus:border-primary/40"
                          />

                          <button
                            onClick={() => removeQuestionOption(option.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-error/20 text-error transition hover:bg-error/10"
                            title="Remove option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSaveQuestion}
                    disabled={addingQuestion}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingQuestion ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : questionMode === "edit" ? (
                      <Pencil className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {questionMode === "edit" ? "Save Question" : "Add Question"}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-outline/30 py-10 text-center text-sm text-on-surface-variant">
                Load schema and select a section to design questions.
              </div>
            )}
          </div>
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
            <h4 className="text-xl font-bold text-on-surface">Confirm Delete</h4>
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
    </div>
  );
}
