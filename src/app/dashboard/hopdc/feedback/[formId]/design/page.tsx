"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Clock,
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
  "SHORT_TEXT",
  "PARAGRAPH",
  "RADIO",
  "CHECKBOX",
  "DROPDOWN",
  "LINEAR_SCALE",
];

type SectionAction = "NEXT" | "SUBMIT" | "GO_TO_SECTION";
type SectionEditorMode = "create" | "edit" | "view";
type QuestionEditorMode = "create" | "edit" | "view";

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

type GoogleFormsPreviewProps = {
  schema: FeedbackFormFullSchema | null;
  height?: number;
};

function GoogleFormsPreview({ schema, height }: GoogleFormsPreviewProps) {
  const [currentSectionId, setCurrentSectionId] = useState<string>("");

  // Get all sections
  const sections = useMemo(() => schema?.sections || [], [schema]);

  // Set default section when schema loads
  useEffect(() => {
    if (sections.length > 0) {
      // Find the first section
      setCurrentSectionId(sections[0].sectionId);
    } else {
      setCurrentSectionId("");
    }
  }, [sections]);

  // Find the active section details
  const activeSection = useMemo(() => {
    return sections.find((s) => s.sectionId === currentSectionId) || null;
  }, [sections, currentSectionId]);

  const activeSectionIndex = useMemo(() => {
    return sections.findIndex((s) => s.sectionId === currentSectionId);
  }, [sections, currentSectionId]);

  if (!schema) {
    return (
      <div className="rounded-3xl border border-[#dadce0] bg-white p-8 text-center text-gray-500 shadow-sm font-sans">
        <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-semibold">No schema loaded for preview.</p>
      </div>
    );
  }

  const handleNext = () => {
    if (!activeSection) return;

    // Check if there is a branching action or actionAfter
    const action =
      activeSection.actionAfter || activeSection.afterSectionAction || "NEXT";
    const target = activeSection.targetSectionId;

    if (action === "SUBMIT") {
      alert("🎉 Google Forms Preview: Form simulated submission successfully!");
      // Reset back to section 1
      if (sections.length > 0) {
        setCurrentSectionId(sections[0].sectionId);
      }
      return;
    }

    if (action === "GO_TO_SECTION" && target) {
      const exists = sections.some((s) => s.sectionId === target);
      if (exists) {
        setCurrentSectionId(target);
        return;
      }
    }

    // Default: go to next section in list
    if (activeSectionIndex < sections.length - 1) {
      setCurrentSectionId(sections[activeSectionIndex + 1].sectionId);
    } else {
      alert(
        "🎉 Google Forms Preview: Form simulated submission successfully (Last section reached)!",
      );
      if (sections.length > 0) {
        setCurrentSectionId(sections[0].sectionId);
      }
    }
  };

  const handleBack = () => {
    if (activeSectionIndex > 0) {
      setCurrentSectionId(sections[activeSectionIndex - 1].sectionId);
    }
  };

  return (
    <div
      className="rounded-[32px] border border-outline/10 bg-surface-container-lowest/50 p-6 sm:p-8 shadow-sm font-sans text-[#202124] flex flex-col overflow-hidden w-full"
      style={{ height: height ? `${height}px` : "auto" }}
    >
      {/* Title & Badge */}
      <div className="mb-4 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#673ab7]/80">
          <Eye className="h-3.5 w-3.5" />
          Google Forms Live Preview
        </span>
        {sections.length > 1 && (
          <span className="text-[11px] font-semibold text-gray-500">
            Section {activeSectionIndex + 1} of {sections.length}
          </span>
        )}
      </div>

      {/* Main Google Form Container */}
      <div className="space-y-4 flex-1 h-0 overflow-y-auto pr-1">
        {/* Form Title Card */}
        <div className="overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-xs">
          {/* Iconic Google Purple Top Strip */}
          <div className="h-2.5 w-full bg-[#673ab7]" />
          <div className="p-6">
            <h1 className="text-3xl font-normal tracking-tight text-[#202124] break-words leading-tight">
              {schema.title || "Untitled Form"}
            </h1>
            <p className="mt-2 text-sm font-normal text-[#202124] break-words whitespace-pre-wrap leading-relaxed">
              {schema.description || "Feedback and assessment form."}
            </p>

            {/* Required field indicator */}
            <div className="mt-4 border-t border-[#dadce0]/80 pt-3 text-xs text-[#d93025]">
              * Indicates required question
            </div>
          </div>
        </div>

        {/* Dynamic Section Title Card (Only if sections exist and has title) */}
        {activeSection && activeSection.title && (
          <div className="rounded-xl border border-[#dadce0] bg-white p-6 shadow-xs">
            <h2 className="text-xl font-normal text-[#202124] break-words leading-snug">
              {activeSection.title}
            </h2>
          </div>
        )}

        {/* Questions in Current Section */}
        {activeSection &&
        activeSection.questions &&
        activeSection.questions.length > 0 ? (
          activeSection.questions.map((q, idx) => {
            const isScale = q.type === "SCALE" || q.type === "LINEAR_SCALE";
            const isCheckbox = q.type === "CHECKBOX";
            const isRadio = q.type === "RADIO";
            const isDropdown = q.type === "DROPDOWN";

            return (
              <div
                key={q.questionId || idx}
                className="rounded-xl border border-[#dadce0] bg-white p-6 shadow-xs transition-shadow duration-200 hover:shadow-sm"
              >
                {/* Question Text */}
                <div className="text-base font-normal text-[#202124] break-words flex gap-1 items-start leading-snug">
                  <span>{q.content || "Question"}</span>
                  {q.isRequired && (
                    <span
                      className="text-[#d93025] font-normal"
                      title="Required"
                    >
                      *
                    </span>
                  )}
                </div>

                {/* Answers Fields Styled precisely like Google Forms */}
                <div className="mt-4">
                  {/* TEXT, SHORT_TEXT, PARAGRAPH types */}
                  {(q.type === "TEXT" ||
                    q.type === "SHORT_TEXT" ||
                    q.type === "PARAGRAPH") && (
                    <div className="w-full">
                      <input
                        type="text"
                        disabled
                        placeholder="Your answer"
                        className="w-full sm:max-w-md border-b border-[#dadce0]/80 bg-transparent py-1.5 text-sm font-normal text-[#202124] outline-none transition-all duration-300 placeholder:text-gray-400/70"
                      />
                    </div>
                  )}

                  {/* RADIO or CHECKBOX choice list */}
                  {(isRadio || isCheckbox) && (
                    <div className="space-y-3">
                      {q.options && q.options.length > 0 ? (
                        q.options.map((opt, oIdx) => {
                          const optionText = opt.optionText || opt.text || "";
                          return (
                            <label
                              key={oIdx}
                              className="flex items-start gap-3 text-sm font-normal text-[#202124] cursor-pointer select-none"
                            >
                              <input
                                type={isCheckbox ? "checkbox" : "radio"}
                                disabled
                                name={q.questionId}
                                className={`mt-0.5 h-4 w-4 border-[#dadce0] text-[#673ab7] focus:ring-[#673ab7] ${
                                  isCheckbox ? "rounded" : ""
                                }`}
                              />
                              <span className="break-all">{optionText}</span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          No choices configured.
                        </div>
                      )}
                    </div>
                  )}

                  {/* DROPDOWN select list */}
                  {isDropdown && (
                    <div className="w-full sm:max-w-xs">
                      <select
                        disabled
                        className="w-full rounded border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#202124] outline-none"
                      >
                        <option>Choose</option>
                        {q.options?.map((opt, oIdx) => (
                          <option key={oIdx}>
                            {opt.optionText || opt.text}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* LINEAR_SCALE / SCALE type (Numbered Horizontal Grid) */}
                  {isScale && (
                    <div className="mt-2 flex items-center justify-center gap-3 sm:gap-5 rounded-xl border border-gray-100 bg-[#f8f9fa] p-4">
                      <span className="text-xs font-semibold text-gray-500">
                        Worst
                      </span>
                      <div className="flex items-center gap-3 sm:gap-5">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div
                            key={num}
                            className="flex flex-col items-center gap-2"
                          >
                            <span className="text-xs font-bold text-gray-600">
                              {num}
                            </span>
                            <input
                              type="radio"
                              disabled
                              name={q.questionId}
                              className="h-4.5 w-4.5 border-[#dadce0] text-[#673ab7] focus:ring-[#673ab7]"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        Best
                      </span>
                    </div>
                  )}

                  {/* DATE input type */}
                  {q.type === "DATE" && (
                    <div className="w-full sm:max-w-xs">
                      <input
                        type="date"
                        disabled
                        className="border-b border-[#dadce0]/80 bg-transparent py-1.5 text-sm font-normal text-gray-400 outline-none w-full"
                      />
                    </div>
                  )}

                  {/* TIME input type */}
                  {q.type === "TIME" && (
                    <div className="w-full sm:max-w-xs">
                      <input
                        type="time"
                        disabled
                        className="border-b border-[#dadce0]/80 bg-transparent py-1.5 text-sm font-normal text-gray-400 outline-none w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-[#dadce0] bg-white p-10 text-center text-sm text-gray-400 italic">
            No questions inside this section.
          </div>
        )}

        {/* Section Navigation Buttons at the bottom */}
        {sections.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div>
              {activeSectionIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="rounded bg-white px-6 py-2 text-sm font-semibold text-[#673ab7] border border-[#dadce0] transition hover:bg-gray-50 hover:shadow-xs active:bg-gray-100"
                >
                  Back
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              className="rounded bg-[#673ab7] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#5e35b1] hover:shadow-xs active:bg-[#512da8]"
            >
              {activeSectionIndex === sections.length - 1 ? "Submit" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FormDesignPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = React.use(params);
  const router = useRouter();
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

  const [selectedResultFormId, setSelectedResultFormId] = useState<
    string | null
  >(null);
  const [activeResultTab, setActiveResultTab] = useState<
    "submissions" | "report"
  >("submissions");
  const [activeMainTab, setActiveMainTab] = useState<"manage" | "designer">(
    "manage",
  );

  // Schedule close modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleCloseAt, setScheduleCloseAt] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [filterFormType, setFilterFormType] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [designerFormId, setDesignerFormId] = useState("");
  const [schema, setSchema] = useState<FeedbackFormFullSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);
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
          const height =
            entry.target.clientHeight ||
            (entry.target as HTMLElement).offsetHeight;
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

  const [sectionMode, setSectionMode] =
    useState<SectionEditorMode>("view");
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
    useState<QuestionEditorMode>("view");
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
    setSectionMode("view");
    setEditingSectionId(null);
    setSectionForm({
      title: "",
      afterSectionAction: "NEXT",
      targetSectionId: "",
    });
  };

  const resetQuestionEditor = () => {
    setQuestionMode("view");
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
    }
    fillly: {
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
    setSelectedResultFormId(null);
    setActiveMainTab("manage");
    setDesignerFormId("");
    setSchema(null);
    await loadCurriculums(value);
  };

  const handleCurriculumChange = async (value: string) => {
    setCurriculumId(value);
    setSuccess(null);
    setFilterFormType("ALL");
    setSelectedResultFormId(null);
    setActiveMainTab("manage");
    setDesignerFormId("");
    setSchema(null);
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
        formName: resolvedFormType,
        description: "",
      } as any);
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
      showToast(
        response?.message || "Publish request sent successfully.",
        "success",
      );
    } catch (err: any) {
      const message = err?.message || "Failed to publish feedback form";
      setError(message);
      showToast(message, "error");
    } finally {
      setPublishingFormId(null);
    }
  };

  const loadDesignerSchema = async (
    inputFormId?: string,
    isBackgroundReload: boolean = false
  ) => {
    const targetFormId = (inputFormId || designerFormId).trim();
    if (!targetFormId) {
      setError("Please enter form id to load schema.");
      return;
    }

    if (!isBackgroundReload) {
      setLoadingSchema(true);
    } else {
      setIsRefreshingSchema(true);
    }
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


    } catch (err: any) {
      setSchema(null);
      setSelectedSectionId("");
      setError(err?.message || "Failed to load form schema");
    } finally {
      if (!isBackgroundReload) {
        setLoadingSchema(false);
      } else {
        setIsRefreshingSchema(false);
      }
    }
  };

  const handleOpenDesigner = async (formId: string) => {
    setDesignerFormId(formId);
    setActiveMainTab("designer");
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
      await loadDesignerSchema(targetFormId, true);
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
      await loadDesignerSchema(designerFormId, true);
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

      await loadDesignerSchema(designerFormId, true);

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

  const handleScheduleClose = async () => {
    if (!scheduleCloseAt) {
      showToast("Please select a closing time.", "error");
      return;
    }

    try {
      setIsScheduling(true);
      await FeedbackFormService.scheduleClose(formId, {
        closeAt: new Date(scheduleCloseAt).toISOString(),
      });
      showToast("Scheduled form closing time successfully.", "success");
      setScheduleModalOpen(false);
      setScheduleCloseAt("");
    } catch (err: any) {
      showToast(err.message || "Failed to schedule closing time.", "error");
    } finally {
      setIsScheduling(false);
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

  useEffect(() => {
    if (formId) {
      loadDesignerSchema(formId);
    }
  }, [formId]);

  return (
    <div className="space-y-8 p-4 bg-white min-h-screen">
      <div className="mx-auto pt-12 pb-12 px-6 transition-all duration-500 max-w-7xl xl:max-w-[1500px]">
        <div className="space-y-6">
          <div className="mb-4">
            <button
              onClick={() => {
                router.push("/dashboard/hopdc/feedback");
              }}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant/60 transition duration-300 hover:text-on-surface"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Forms
            </button>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-on-surface">Form Designer</h1>
                <p className="mt-2 text-sm text-on-surface-variant/70 font-medium">Design custom feedback forms, configure sections, and set navigation rules with ease.</p>
              </div>
              {schema && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScheduleModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/20 border border-primary/20 shadow-sm"
                  >
                    <Clock className="h-4 w-4" />
                    Set Close Time
                  </button>
                  <button
                    onClick={() => handlePublish(formId)}
                    disabled={publishingFormId === formId}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {publishingFormId === formId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Publish Form
                  </button>
                  {isRefreshingSchema && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
                  )}
                </div>
              )}
            </div>
          </div>

          {loadingSchema ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-outline/20 bg-surface/40 p-10 shadow-xl shadow-black/5 backdrop-blur-2xl"
            >
              <div className="flex flex-col items-center justify-center gap-5 py-16">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ListTree className="h-5 w-5 text-primary/60" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-on-surface">
                    Loading Form Designer
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant/70">
                    Fetching schema, sections and questions...
                  </p>
                </div>
                {/* Skeleton bars */}
                <div className="w-full max-w-lg space-y-3 mt-4">
                  <div className="h-4 w-3/4 rounded-lg bg-outline/10 animate-pulse" />
                  <div className="h-4 w-full rounded-lg bg-outline/10 animate-pulse" />
                  <div className="h-4 w-5/6 rounded-lg bg-outline/10 animate-pulse" />
                  <div className="h-4 w-2/3 rounded-lg bg-outline/10 animate-pulse" />
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 items-start">
              <div className="xl:col-span-7 w-full">
                <motion.div
                  ref={designerRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-[32px] bg-white p-10 shadow-2xl shadow-primary/5 ring-1 ring-outline/5 w-full min-h-[700px] relative"
                >
                  {/* Grid layout for Sections vs Questions */}
                  <div className="absolute top-8 right-8">
                    <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs font-bold text-on-surface-variant border border-outline/5 shadow-sm">
                      {schema?.sections?.length || 0} Sections
                    </span>
                  </div>
                  <div className="mt-5 flex flex-col gap-8">
                    {/* SECTIONS PANEL */}
                    <div className="w-full flex flex-col gap-4">
                      <div>
                        {loadingSchema ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-on-surface-variant">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Loading sections...
                          </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 border-b border-outline/10 w-full mb-8">

                            {schema?.sections?.map((section, index) => {
                              const isActive = selectedSectionId === section.sectionId;
                              return (
                                <button
                                  key={section.sectionId}
                                  onClick={() => setSelectedSectionId(section.sectionId)}
                                  className={`relative flex items-center px-4 py-3 text-sm font-semibold transition-colors duration-200 border-b-2 -mb-[1px] ${
                                    isActive
                                      ? "border-primary text-primary"
                                      : "border-transparent text-on-surface-variant/70 hover:text-on-surface hover:border-outline/30"
                                  }`}
                                >
                                  {section.title || "Untitled section"}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => { resetSectionEditor(); setSectionMode("create"); setSelectedSectionId(""); }}
                              className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-primary/70 hover:text-primary transition-colors border-b-2 border-transparent -mb-[1px]"
                            >
                              <Plus className="h-4 w-4" />
                              Add Section
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Save section form editor */}
                      {sectionMode !== "view" && (
                        <div
                          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                          onClick={() => {
                            if (!addingSection) resetSectionEditor();
                          }}
                        >
                          <div
                            className="w-full max-w-xl rounded-3xl border border-outline/20 bg-white p-6 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-outline/5 pb-4 mb-4">
                              <h4 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                {sectionMode === "edit"
                                  ? "Edit Section"
                                  : "Add New Section"}
                              </h4>

                              <button
                                onClick={resetSectionEditor}
                                className="inline-flex items-center gap-1 rounded-full border border-outline/20 bg-white px-3 py-1.5 text-xs font-bold text-on-surface-variant transition hover:text-[#ef4444] hover:border-[#ef4444]"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                                  Section Title
                                </label>
                                <input
                                  value={sectionForm.title}
                                  onChange={(e) =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  placeholder="e.g. Personal Information"
                                  className="w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none transition shadow-sm border border-outline/20 focus:border-primary focus:shadow-md"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                                  Action After Section
                                </label>
                                <select
                                  value={sectionForm.afterSectionAction}
                                  onChange={(e) =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      afterSectionAction: e.target
                                        .value as SectionAction,
                                    }))
                                  }
                                  className="w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none transition shadow-sm border border-outline/20 focus:border-primary focus:shadow-md appearance-none"
                                >
                                  <option value="NEXT">Go to next section</option>
                                  <option value="SUBMIT">Submit the form</option>
                                  <option value="GO_TO_SECTION">
                                    Jump to specific section
                                  </option>
                                </select>
                              </div>

                              {sectionForm.afterSectionAction ===
                                "GO_TO_SECTION" && (
                                <div>
                                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                                    Target Section ID
                                  </label>
                                  <input
                                    value={sectionForm.targetSectionId}
                                    onChange={(e) =>
                                      setSectionForm((prev) => ({
                                        ...prev,
                                        targetSectionId: e.target.value,
                                      }))
                                    }
                                    placeholder="e.g. section_2"
                                    className="w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none transition shadow-sm border border-outline/20 focus:border-primary focus:shadow-md"
                                  />
                                </div>
                              )}

                              <button
                                onClick={handleSaveSection}
                                disabled={addingSection || !designerFormId.trim()}
                                className="inline-flex mt-4 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {addingSection ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : sectionMode === "edit" ? (
                                  <Pencil className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                                {sectionMode === "edit"
                                  ? "Save Section"
                                  : "Add Section"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QUESTIONS PANEL */}
                    <div className="w-full flex flex-col gap-4">
                      <div>
                        <div className="mb-8 flex items-center justify-between">
                          <h3 className="text-2xl font-black text-on-surface flex items-center gap-3">
                            {selectedSection?.title || "Untitled Section"}
                          </h3>
                          {selectedSection && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSection(selectedSection)}
                                className="flex items-center gap-2 rounded-lg bg-transparent px-3 py-1.5 text-sm font-bold text-on-surface border border-on-surface transition hover:text-[#f59e0b] hover:border-[#f59e0b] shadow-sm"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSection(selectedSection.sectionId)}
                                className="flex items-center gap-2 rounded-lg bg-transparent px-3 py-1.5 text-sm font-bold text-on-surface border border-on-surface transition hover:text-[#ef4444] hover:border-[#ef4444] shadow-sm"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {selectedSection ? (
                          <div className="space-y-3">
                            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                              {(selectedSection.questions || []).length > 0 ? (
                                (selectedSection.questions || []).map(
                                  (question, index) => (
                                    <div
                                      key={question.questionId}
                                      className="group/q relative bg-white transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between border-y border-transparent hover:border-outline/5 hover:bg-surface-container-lowest/50"
                                    >
                                      <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-primary/20 group-hover/q:bg-primary transition-colors" />
                                      <div className="pl-4">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant/50">
                                              Question {index + 1}
                                            </span>
                                            <span className="rounded bg-surface-container px-1.5 py-0.5 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                                              {question.type}
                                            </span>
                                            {question.isRequired && (
                                              <span className="rounded bg-error/10 px-1.5 py-0.5 text-[9px] font-bold text-error uppercase tracking-wider">
                                                * Required
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => handleEditQuestion(question)}
                                              className="rounded p-1.5 text-on-surface-variant/50 transition hover:text-[#f59e0b]"
                                              title="Edit question"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteQuestion(question.questionId)}
                                              className="rounded p-1.5 text-on-surface-variant/50 transition hover:text-[#ef4444]"
                                              title="Delete question"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>

                                        <p className="text-base font-bold text-on-surface break-all">
                                          {question.content}
                                        </p>

                                        {!!question.options?.length && (
                                          <div className="mt-2.5 border-t border-outline/5 pt-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                                              Options:
                                            </span>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                              {question.options
                                                .map(
                                                  (opt) =>
                                                    opt.text || opt.optionText,
                                                )
                                                .filter(Boolean)
                                                .map((text, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="inline-flex items-center rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant border border-outline/5"
                                                  >
                                                    {text}
                                                  </span>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )
                              ) : (
                                <div className="rounded-2xl border border-dashed border-outline/25 py-12 text-center text-on-surface-variant/80 bg-white/30">
                                  <ClipboardList className="h-8 w-8 text-outline/50 mx-auto mb-2" />
                                  <p className="text-sm font-semibold">
                                    No questions yet
                                  </p>
                                  <p className="text-xs mt-1 text-on-surface-variant/60">
                                    Configure your first question using the tool
                                    below.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Save question form editor */}
                            {questionMode !== "view" && (
                              <div
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                                onClick={() => {
                                  if (!addingQuestion) resetQuestionEditor();
                                }}
                              >
                                <div
                                  className="w-full max-w-2xl rounded-3xl border border-outline/20 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-outline/5 pb-4 mb-4">
                                    <h4 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                                      <Plus className="h-4 w-4" />
                                      {questionMode === "edit"
                                        ? "Edit Question Details"
                                        : "Add New Question"}
                                    </h4>

                                    <button
                                      onClick={resetQuestionEditor}
                                      className="inline-flex items-center gap-1 rounded-full border border-outline/20 bg-white px-3 py-1.5 text-xs font-bold text-on-surface-variant transition hover:text-[#ef4444] hover:border-[#ef4444]"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Cancel
                                    </button>
                                  </div>

                              <div className="space-y-4">
                                <div>
                                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                                    Question Label / Title
                                  </label>
                                  <textarea
                                    value={questionForm.content}
                                    onChange={(e) =>
                                      setQuestionForm((prev) => ({
                                        ...prev,
                                        content: e.target.value,
                                      }))
                                    }
                                    placeholder="e.g. Rate your overall satisfaction"
                                    rows={4}
                                    className="w-full rounded-xl bg-white px-3 py-2 text-sm outline-none transition shadow-sm border-b-2 border-transparent focus:border-primary focus:shadow-md resize-y"
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                                      Answer Input Type
                                    </label>
                                    <select
                                      value={questionForm.type}
                                      onChange={(e) =>
                                        setQuestionForm((prev) => ({
                                          ...prev,
                                          type: e.target
                                            .value as FeedbackCreateQuestionPayload["type"],
                                        }))
                                      }
                                      className="w-full rounded-xl bg-white px-3 py-2 text-sm outline-none transition shadow-sm border-b-2 border-transparent focus:border-primary focus:shadow-md"
                                    >
                                      <option value="">Choose type...</option>
                                      {QUESTION_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                          {type}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                                      Settings
                                    </label>
                                    <label className="group/req inline-flex w-fit items-center gap-2 rounded-lg hover:bg-surface-container-highest/50 px-2 py-1.5 -ml-2 text-sm text-on-surface-variant cursor-pointer transition-all select-none">
                                      <input
                                        type="checkbox"
                                        checked={questionForm.isRequired}
                                        onChange={(e) =>
                                          setQuestionForm((prev) => ({
                                            ...prev,
                                            isRequired: e.target.checked,
                                          }))
                                        }
                                        className="h-4 w-4 rounded-md border-outline/30 text-primary focus:ring-primary/15 cursor-pointer transition-all group-hover/req:border-primary/50"
                                      />
                                      <span className="font-bold text-xs uppercase tracking-wider text-on-surface-variant/80 group-hover/req:text-primary transition-colors">
                                        Required Field
                                      </span>
                                    </label>
                                  </div>
                                </div>

                                  {questionNeedsOptions && (
                                    <div className="mt-4 pt-3 border-t border-outline/5">
                                      <div className="flex items-center justify-between gap-2 pb-3">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/80">
                                          Question Choices / Options
                                        </p>
                                        <button
                                          onClick={addQuestionOption}
                                          className="inline-flex items-center gap-1 text-xs font-bold text-primary/80 transition hover:text-primary active:scale-95"
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                          Add Choice
                                        </button>
                                      </div>

                                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                                        {questionOptions.map((option, index) => (
                                          <div
                                            key={option.id}
                                            className="group/opt flex items-center gap-3 relative"
                                          >
                                            <div className="h-2 w-2 rounded-full border-2 border-outline/30 mt-0.5 flex-shrink-0" />
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
                                              className="flex-1 border-b border-outline/20 bg-transparent py-1.5 text-sm outline-none transition focus:border-primary/50 text-on-surface"
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
                                              placeholder="Jump to Section ID (optional)"
                                              className="flex-1 border-b border-outline/20 bg-transparent py-1.5 text-xs outline-none transition focus:border-primary/50 text-on-surface-variant"
                                            />

                                            <button
                                              onClick={() =>
                                                removeQuestionOption(option.id)
                                              }
                                              className="opacity-0 group-hover/opt:opacity-100 absolute right-0 p-1.5 text-error/60 transition hover:text-error hover:bg-error/10 rounded-md bg-surface-container-lowest"
                                              title="Remove option"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    onClick={handleSaveQuestion}
                                    disabled={addingQuestion}
                                    className="inline-flex mt-4 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {addingQuestion ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : questionMode === "edit" ? (
                                      <Pencil className="h-4 w-4" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                    {questionMode === "edit"
                                      ? "Save Question Details"
                                      : "Add Question"}
                                  </button>
                              </div>
                                </div>
                              </div>
                            )}

                            {questionMode === "view" && (
                              <button
                                onClick={() => {
                                  resetQuestionEditor();
                                  setQuestionMode("create");
                                }}
                                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90 shadow-md shadow-primary/20"
                              >
                                <Plus className="h-4 w-4" />
                                Add New Question
                              </button>
                            )}
                            
                            <div className="mt-8 pt-6 border-t border-outline/10 flex items-center justify-between text-sm font-semibold text-on-surface-variant/80">
                              <span>After section {(schema?.sections?.findIndex(s => s.sectionId === selectedSection.sectionId) ?? -1) + 1}</span>
                              <div className="flex items-center gap-2 text-primary">
                                <span>
                                  {(() => {
                                    const action = selectedSection.actionAfter || selectedSection.afterSectionAction || "NEXT";
                                    if (action === "NEXT") return "Continue to next section";
                                    if (action === "SUBMIT") return "Submit form";
                                    if (action === "GO_TO_SECTION") {
                                      const target = schema?.sections?.find(s => s.sectionId === selectedSection.targetSectionId);
                                      return target ? `Go to section ${(schema?.sections?.indexOf(target) ?? -1) + 1} (${target.title || 'Untitled'})` : "Go to section (Not found)";
                                    }
                                    return "Continue to next section";
                                  })()}
                                </span>
                                <button
                                  onClick={() => handleEditSection(selectedSection)}
                                  className="p-1.5 hover:bg-primary/10 rounded-full transition-colors text-primary"
                                  title="Change action"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-outline/25 py-16 text-center text-on-surface-variant/80 bg-white/30">
                            <ListTree className="h-8 w-8 text-outline/50 mx-auto mb-2" />
                            <p className="text-sm font-semibold">
                              No section selected
                            </p>
                            <p className="text-xs mt-1 text-on-surface-variant/60">
                              Select or load a section from the left column to
                              build and manage its questions.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="xl:col-span-5 w-full flex flex-col h-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <GoogleFormsPreview schema={schema} height={designerHeight} />
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {deleteConfirm && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            onClick={() => {
              if (!deleting) {
                setDeleteConfirm(null);
              }
            }}
          >
            <div
              className="w-full max-w-xl rounded-3xl border border-outline/20 bg-white p-5 shadow-2xl"
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
                  className="inline-flex items-center justify-center rounded-xl border border-outline/20 bg-surface px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:text-[#ef4444] hover:border-[#ef4444] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ef4444]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Close Modal */}
        {scheduleModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => !isScheduling && setScheduleModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-outline/20 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-outline/5 pb-4 mb-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule Close Time
                </h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                    Close Form At
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleCloseAt}
                    onChange={(e) => setScheduleCloseAt(e.target.value)}
                    disabled={isScheduling}
                    className="w-full rounded-xl border border-outline/20 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[10px] text-on-surface-variant/60">
                    Select a date and time to automatically stop accepting responses.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => {
                      setScheduleModalOpen(false);
                      setScheduleCloseAt("");
                    }}
                    disabled={isScheduling}
                    className="inline-flex items-center justify-center rounded-xl border border-outline/20 bg-surface px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:text-[#ef4444] hover:border-[#ef4444] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleClose}
                    disabled={isScheduling || !scheduleCloseAt}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-primary/20"
                  >
                    {isScheduling && <Loader2 className="h-4 w-4 animate-spin" />}
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
