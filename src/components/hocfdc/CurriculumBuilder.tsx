"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Layers,
  Plus,
  Trash2,
  Save,
  Box,
  FileText,
  Loader2,
  Link2,
  Unlink,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SubjectService } from "@/services/subject.service";
import { CurriculumSubject } from "@/services/curriculum.service";
import { GroupService } from "@/services/group.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { apiClient } from "@/lib/api-client";

export interface SoftGroup {
  groupId: string;
  code: string;
  name: string;
  type: "COMBO" | "ELECTIVE";
}

export interface DraftSubject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semester: number;
  groupId?: string | null;
}

interface CurriculumBuilderProps {
  curriculumId: string;
  initialSubjects?: DraftSubject[];
}

interface PrerequisiteError {
  subjectId: string;
  type: "SEMESTER" | "CYCLE" | "ELECTIVE_CREDIT" | "ELECTIVE_SEMESTER";
  message: string;
}

// Custom Tree Node Component
const TreeNode = ({ label, icon, childrenList, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="text-zinc-700">
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-100 rounded-none cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-zinc-400">
          {childrenList &&
            (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        <span className={`${isOpen ? "text-primary" : "text-zinc-400"}`}>
          {icon || (isOpen ? <FolderOpen size={14} /> : <Folder size={14} />)}
        </span>
        <span className="text-sm font-bold select-none">{label}</span>
      </div>
      {isOpen && childrenList && (
        <div className="pl-6 border-l border-zinc-200 ml-3">{childrenList}</div>
      )}
    </div>
  );
};

export default function CurriculumBuilder({
  curriculumId,
  initialSubjects,
}: CurriculumBuilderProps) {
  const queryClient = useQueryClient();
  const [draftSubjects, setDraftSubjects] = useState<DraftSubject[]>(
    initialSubjects || [],
  );
  const [semesterCount, setSemesterCount] = useState(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      return Math.max(5, ...initialSubjects.map((s) => s.semester));
    }
    return 5;
  });
  const [hasSemesterZero, setHasSemesterZero] = useState(
    () => initialSubjects?.some((s) => s.semester === 0) || false,
  );
  const [activeSemester, setActiveSemester] = useState(1);

  const [rightTab, setRightTab] = useState<"WAREHOUSE" | "GROUPS" | "TREE">(
    "WAREHOUSE",
  );
  const [search, setSearch] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Prerequisite Cache & Validation
  const [prereqCache, setPrereqCache] = useState<Record<string, any[]>>({});
  const [validationErrors, setValidationErrors] = useState<PrerequisiteError[]>(
    [],
  );
  const [isValidating, setIsValidating] = useState(false);

  // Group Creation Form
  const [newGroupType, setNewGroupType] = useState<"COMBO" | "ELECTIVE">(
    "COMBO",
  );
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  // Queries
  const { data: subjectData, isLoading: isLoadingSub } = useQuery({
    queryKey: ["warehouse-subjects", search, selectedDepartmentId],
    queryFn: () =>
      SubjectService.getSubjects({
        search,
        departmentId: selectedDepartmentId || undefined,
        size: 50,
      }),
  });

  const { data: deptData } = useQuery({
    queryKey: ["all-departments"],
    queryFn: () => SubjectService.getDepartments({ size: 100 }),
  });

  const departments =
    (deptData?.data as any)?.content ||
    (Array.isArray(deptData?.data) ? deptData?.data : []);

  const {
    data: groupData,
    isLoading: isLoadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ["warehouse-groups"],
    queryFn: () => GroupService.getGroups(),
  });

  const groupContent =
    groupData?.data && "content" in groupData.data
      ? groupData.data.content
      : Array.isArray(groupData?.data)
        ? groupData.data
        : [];

  const existingGroups: SoftGroup[] = groupContent.map((g: any) => ({
    groupId: g.groupId,
    code: g.groupCode,
    name: g.groupName,
    type: g.type,
  }));

  const allWarehouseSubjects = subjectData?.data?.content || [];
  const warehouseSubjects = allWarehouseSubjects.filter(
    (sub) => !draftSubjects.some((draft) => draft.subjectId === sub.subjectId),
  );

  // --- Validation Logic ---

  // Fetch missing prerequisites
  const fetchPrerequisites = async (subjectIds: string[]) => {
    const missing = subjectIds.filter((id) => !prereqCache[id]);
    if (missing.length === 0) return;

    setIsValidating(true);
    try {
      const newPrereqs = { ...prereqCache };
      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await SubjectService.getPrerequisites(id);
            newPrereqs[id] = res.data || [];
          } catch (e) {
            newPrereqs[id] = [];
          }
        }),
      );
      setPrereqCache(newPrereqs);
    } finally {
      setIsValidating(false);
    }
  };

  // Run validation whenever draftSubjects or prereqCache changes
  const runValidation = () => {
    const errors: PrerequisiteError[] = [];

    // 1. Semester Violation Check
    draftSubjects.forEach((subject) => {
      const prereqs = prereqCache[subject.subjectId];
      if (!prereqs) return;

      prereqCache[subject.subjectId]?.forEach((p) => {
        const pInDraft = draftSubjects.find(
          (ds) => ds.subjectCode === p.prerequisiteSubjectCode,
        );
        if (!pInDraft) {
          errors.push({
            subjectId: subject.subjectId,
            type: "SEMESTER", // Using SEMESTER type for general prerequisite issues or could create 'MISSING'
            message: `Prerequisite subject ${p.prerequisiteSubjectCode} was not found in the curriculum.`,
          });
        } else if (pInDraft.semester >= subject.semester) {
          errors.push({
            subjectId: subject.subjectId,
            type: "SEMESTER",
            message: `Prerequisite subject ${p.prerequisiteSubjectCode} should be learned in a previous semester.`,
          });
        }
      });
    });

    // 2. Circular Dependency Detection (DFS)
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cyclesFound = new Set<string>();

    const hasCycle = (v: string) => {
      if (recStack.has(v)) return true;
      if (visited.has(v)) return false;

      visited.add(v);
      recStack.add(v);

      const prereqs = prereqCache[v] || [];
      for (const p of prereqs) {
        const pSub = draftSubjects.find(
          (ds) => ds.subjectCode === p.prerequisiteSubjectCode,
        );
        if (pSub && hasCycle(pSub.subjectId)) return true;
      }

      recStack.delete(v);
      return false;
    };

    draftSubjects.forEach((subject) => {
      if (!visited.has(subject.subjectId)) {
        if (hasCycle(subject.subjectId)) {
          cyclesFound.add(subject.subjectId);
        }
      }
    });

    if (cyclesFound.size > 0) {
      draftSubjects.forEach((s) => {
        if (cyclesFound.has(s.subjectId)) {
          errors.push({
            subjectId: s.subjectId,
            type: "CYCLE",
            message: "Phát hiện vòng lặp tiên quyết liên quan đến môn này.",
          });
        }
      });
    }

    // 3. Elective Group Consistency Check
    const subjectsWithGroups = draftSubjects.filter((s) => !!s.groupId);
    const groupsToCheck = Array.from(
      new Set(subjectsWithGroups.map((s) => s.groupId!)),
    );

    groupsToCheck.forEach((grpId) => {
      const groupDef = existingGroups.find((g) => g.groupId === grpId);
      if (groupDef?.type === "ELECTIVE") {
        const members = draftSubjects.filter((s) => s.groupId === grpId);
        if (members.length > 1) {
          const first = members[0];
          members.forEach((m) => {
            if (m.credits !== first.credits) {
              errors.push({
                subjectId: m.subjectId,
                type: "ELECTIVE_CREDIT",
                message: `Subject credits must be the same for all subjects in an ELECTIVE group.`,
              });
            }
            if (m.semester !== first.semester) {
              errors.push({
                subjectId: m.subjectId,
                type: "ELECTIVE_SEMESTER",
                message: `Subject semester (${m.semester}) doesn't match elective group standard (Semester ${first.semester}).`,
              });
            }
          });
        }
      }
    });

    setValidationErrors(errors);
  };

  // Effects
  useEffect(() => {
    if (draftSubjects.length > 0) {
      const subjectIds = draftSubjects.map((s) => s.subjectId);
      fetchPrerequisites(subjectIds);
    }
  }, [draftSubjects.length]);

  useEffect(() => {
    runValidation();
  }, [draftSubjects, prereqCache]);

  // Actions
  const addSubject = (subject: CurriculumSubject) => {
    if (draftSubjects.some((s) => s.subjectId === subject.subjectId)) {
      alert("Subject already exists in the curriculum.");
      return;
    }

    setDraftSubjects((prev) => [
      ...prev,
      {
        subjectId: subject.subjectId,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        credits: subject.credits || 3,
        semester: activeSemester,
      },
    ]);
  };

  const removeSubject = (id: string) => {
    setDraftSubjects((prev) => prev.filter((s) => s.subjectId !== id));
  };

  const addSemester = () => {
    setSemesterCount((prev) => prev + 1);
  };

  const removeSemester = (semNum: number) => {
    if (semNum === 0) {
      setHasSemesterZero(false);
      setDraftSubjects((prev) => prev.filter((s) => s.semester !== 0));
      if (activeSemester === 0) setActiveSemester(1);
      return;
    }

    // 1. Remove subjects in that semester
    // 2. Shift subjects in higher semesters down
    setDraftSubjects((prev) =>
      prev
        .filter((s) => s.semester !== semNum)
        .map((s) =>
          s.semester > semNum ? { ...s, semester: s.semester - 1 } : s,
        ),
    );

    // 3. Decrement count
    setSemesterCount((prev) => Math.max(1, prev - 1));

    // 4. Adjust active session
    if (activeSemester === semNum) {
      setActiveSemester(Math.max(1, semNum - 1));
    } else if (activeSemester > semNum) {
      setActiveSemester((prev) => prev - 1);
    }
  };

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const createSoftGroup = async () => {
    if (!newGroupCode || !newGroupName) return;
    setIsCreatingGroup(true);
    try {
      await GroupService.createGroup({
        groupCode: newGroupCode,
        groupName: newGroupName,
        description:
          newGroupDescription.trim() ||
          `Created for curriculum ${curriculumId}`,
        type: newGroupType,
      });

      await refetchGroups();
      setNewGroupCode("");
      setNewGroupName("");
      setNewGroupDescription("");
    } catch (error) {
      console.error(error);
      alert("Failed to create group. Check network/backend config.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const unlinkGroup = (groupId: string) => {
    // Unlink all subjects from this group
    setDraftSubjects((prev) =>
      prev.map((s) => (s.groupId === groupId ? { ...s, groupId: null } : s)),
    );
  };

  const setSubjectGroup = (subjectId: string, groupId: string | null) => {
    setDraftSubjects((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, groupId } : s)),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentSubjectIds = draftSubjects.map((s) => s.subjectId);
      const removedSubjectIds = (initialSubjects || [])
        .filter((is) => !currentSubjectIds.includes(is.subjectId))
        .map((is) => is.subjectId);

      const semestersArr = Array.from(
        { length: semesterCount },
        (_, i) => i + 1,
      );
      const semesterMappings = semestersArr
        .map((semNum) => ({
          semesterNo: semNum,
          subjects: draftSubjects
            .filter((s) => s.semester === semNum)
            .map((s) => ({
              subjectId: s.subjectId,
              groupId: s.groupId || null,
            })),
        }))
        .filter((mapping) => mapping.subjects.length > 0);

      await CurriculumGroupSubjectService.bulkConfigure({
        curriculumId,
        deleteSubjectsList:
          removedSubjectIds.length > 0 ? removedSubjectIds : undefined,
        semesterMappings,
      });

      // Invalidate the cache for this curriculum's subjects
      queryClient.invalidateQueries({
        queryKey: ["curriculum-mapped-subjects", curriculumId],
      });

      alert("Curriculum items saved successfully via bulk configuration!");
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving subjects.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render Data
  const semesters = useMemo(() => {
    const base = Array.from({ length: semesterCount }, (_, i) => i + 1);
    return hasSemesterZero ? [0, ...base] : base;
  }, [semesterCount, hasSemesterZero]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* Left: Design Canvas */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2 pb-12">
        <div className="flex items-center justify-between mb-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Design Curriculum.
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-none hover:bg-primary/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Hierarchy Flow
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prefix Semester 0 Trigger - Positioned before Semester 1 */}
          {!hasSemesterZero && (
            <div className="lg:col-span-2 group/prep border-b border-dashed border-zinc-100 pb-4 mb-2 flex items-center gap-4">
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-zinc-100 to-transparent" />
              <button
                onClick={() => {
                  setHasSemesterZero(true);
                  setActiveSemester(0);
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-none border border-dashed border-zinc-200 text-zinc-400 hover:border-primary hover:text-primary hover:bg-primary/[0.02] transition-all opacity-0 group-hover/prep:opacity-100"
              >
                <Plus size={16} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Enroll Semester 0 (Prep)
                </span>
              </button>
            </div>
          )}
          {semesters.map((semNum: number) => {
            const semSubjects = draftSubjects.filter(
              (s) => s.semester === semNum,
            );

            // Group logic
            const standalones = semSubjects.filter((s) => !s.groupId);
            const groupMap = semSubjects
              .filter((s) => !!s.groupId)
              .reduce(
                (acc, curr) => {
                  const grpId = curr.groupId!;
                  if (!acc[grpId]) acc[grpId] = [];
                  acc[grpId].push(curr);
                  return acc;
                },
                {} as Record<string, DraftSubject[]>,
              );

            return (
              <div
                key={semNum}
                onClick={() => setActiveSemester(semNum)}
                className={`min-h-[280px] rounded-none border-2 transition-all p-7 relative group ${
                  activeSemester === semNum
                    ? "bg-white border-primary shadow-xl shadow-primary/5"
                    : semNum === 0
                      ? "bg-zinc-50/30 border-dashed border-zinc-200"
                      : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <span
                    className={`w-12 h-12 rounded-none flex items-center justify-center text-lg font-black shadow-sm ${
                      activeSemester === semNum
                        ? "bg-primary text-white shadow-primary/20"
                        : semNum === 0 &&
                            draftSubjects.filter((s) => s.semester === 0)
                              .length === 0
                          ? "bg-zinc-200 text-zinc-500"
                          : "bg-white text-zinc-400 border border-zinc-100"
                    }`}
                  >
                    {semNum}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      {semNum === 0 ? "Preparatory" : "Semester"}
                    </span>
                    {(semNum !== 0 || semNum === 0) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSemester(semNum);
                        }}
                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-none transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {semSubjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2 border-2 border-dashed border-zinc-100 rounded-none">
                      <Box size={28} strokeWidth={1} />
                      <p className="text-xs font-black uppercase tracking-widest">
                        Empty Slot
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Standalone Subjects */}
                      {standalones.map((subject) => (
                        <div
                          key={subject.subjectId}
                          className="bg-white p-3 rounded-none border border-zinc-100 shadow-sm flex flex-col gap-2 group/item"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div
                                className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${
                                  validationErrors.some(
                                    (e) => e.subjectId === subject.subjectId,
                                  )
                                    ? "bg-red-50 text-red-500 border border-red-200"
                                    : "bg-zinc-50 text-zinc-400"
                                }`}
                              >
                                {validationErrors.some(
                                  (e) => e.subjectId === subject.subjectId,
                                ) ? (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 2,
                                    }}
                                  >
                                    <Box size={14} />
                                  </motion.div>
                                ) : (
                                  <FileText size={14} />
                                )}
                              </div>
                              <div className="overflow-hidden flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p
                                    className={`text-sm font-black truncate ${validationErrors.some((e) => e.subjectId === subject.subjectId) ? "text-red-600" : "text-zinc-900"}`}
                                  >
                                    {subject.subjectCode} —{" "}
                                    {subject.subjectName}
                                  </p>
                                  <span className="shrink-0 text-xs font-bold px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-none border border-zinc-200">
                                    {subject.credits} CR
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {validationErrors.filter(
                                (e) => e.subjectId === subject.subjectId,
                              ).length > 0 && (
                                <div className="group/tooltip relative">
                                  <div className="w-5 h-5 rounded-none bg-red-100 flex items-center justify-center text-red-600 cursor-help animate-pulse">
                                    <span className="text-xs font-bold">!</span>
                                  </div>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-zinc-900 text-white text-sm rounded-none opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 shadow-xl border border-white/10">
                                    {validationErrors
                                      .filter(
                                        (e) =>
                                          e.subjectId === subject.subjectId,
                                      )
                                      .map((err, i) => (
                                        <p key={i} className="leading-relaxed">
                                          • {err.message}
                                        </p>
                                      ))}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSubject(subject.subjectId);
                                }}
                                className="p-1.5 text-zinc-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all shrink-0"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Linking Dropdown (Native) */}
                          <div className="mt-1 pt-2 border-t border-zinc-50">
                            <select
                              className="w-full bg-zinc-50 border border-zinc-100 rounded-none text-xs font-bold text-zinc-500 p-2 outline-none custom-select appearance-none cursor-pointer"
                              onChange={(e) =>
                                setSubjectGroup(
                                  subject.subjectId,
                                  e.target.value || null,
                                )
                              }
                              value={subject.groupId || ""}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Unlinked (Standalone)</option>
                              {existingGroups.map((g) => (
                                <option key={g.groupId} value={g.groupId}>
                                  Link to: [{g.type}] {g.code}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}

                      {/* Render Soft Groups & their contents in this semester */}
                      {Object.keys(groupMap).map((grpId) => {
                        const groupDef = existingGroups.find(
                          (g) => g.groupId === grpId,
                        );
                        if (!groupDef) return null; // Edge case

                        const members = groupMap[grpId];
                        const isElective = groupDef.type === "ELECTIVE";

                        return (
                          <div
                            key={grpId}
                            className={`p-4 rounded-none border-2 shadow-sm flex flex-col gap-3 ${isElective ? "bg-emerald-50/50 border-emerald-100" : "bg-indigo-50/50 border-indigo-100"}`}
                          >
                            <div
                              className="flex items-center gap-2 border-b pb-2"
                              style={{
                                borderColor: isElective
                                  ? "rgba(16, 185, 129, 0.2)"
                                  : "rgba(99, 102, 241, 0.2)",
                              }}
                            >
                              <Layers
                                size={16}
                                className={
                                  isElective
                                    ? "text-emerald-500"
                                    : "text-indigo-500"
                                }
                              />
                              <p
                                className={`text-xs font-black uppercase truncate flex-1 ${isElective ? "text-emerald-900" : "text-indigo-900"}`}
                              >
                                {groupDef.code}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-none text-white ${isElective ? "bg-emerald-500" : "bg-indigo-500"}`}
                              >
                                {groupDef.type}
                              </span>
                            </div>

                            {/* Render mapped subjects visually contained in the group */}
                            {members.map((sub) => (
                              <div
                                key={sub.subjectId}
                                className="flex flex-col gap-1 bg-white p-2.5 rounded-none border border-white/50 shadow-sm relative group/sub cursor-default"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-sm font-black text-zinc-900 truncate">
                                        {sub.subjectCode} — {sub.subjectName}
                                      </p>
                                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 bg-zinc-50 text-zinc-500 rounded-none border border-zinc-100">
                                        {sub.credits} CR
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {validationErrors.filter(
                                      (e) => e.subjectId === sub.subjectId,
                                    ).length > 0 && (
                                      <div className="group/tooltip relative">
                                        <div className="w-5 h-5 rounded-none bg-red-100 flex items-center justify-center text-red-600 cursor-help animate-pulse">
                                          <span className="text-xs font-bold">
                                            !
                                          </span>
                                        </div>
                                        <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-zinc-900 text-white text-sm rounded-none opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 shadow-xl border border-white/10">
                                          {validationErrors
                                            .filter(
                                              (e) =>
                                                e.subjectId === sub.subjectId,
                                            )
                                            .map((err, i) => (
                                              <p
                                                key={i}
                                                className="leading-relaxed"
                                              >
                                                • {err.message}
                                              </p>
                                            ))}
                                          <div className="absolute top-full right-2 border-8 border-transparent border-t-zinc-900" />
                                        </div>
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSubjectGroup(sub.subjectId, null);
                                      }}
                                      className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-500 rounded-none opacity-0 group-hover/sub:opacity-100 transition-all flex items-center gap-1"
                                    >
                                      <Unlink size={16} /> Unlink
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {activeSemester === semNum && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-none"
                  />
                )}
              </div>
            );
          })}

          {/* Add Semester Placeholder */}
          <button
            onClick={addSemester}
            className="min-h-[280px] rounded-none border-2 border-dashed border-zinc-200 hover:border-primary/50 hover:bg-primary/[0.02] transition-all flex flex-col items-center justify-center gap-4 group/add"
          >
            <div className="w-12 h-12 rounded-none bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover/add:bg-primary group-hover/add:text-white transition-all">
              <Plus size={24} strokeWidth={3} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                Append Semester
              </p>
              <p className="text-xs font-bold text-zinc-400 uppercase mt-1">
                Insert new academic block
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Right: Tools & Warehouse Sidebar */}
      <div className="w-[340px] flex flex-col bg-white border border-zinc-100 rounded-none shadow-sm overflow-hidden shrink-0">
        {/* Tabs Area */}
        <div className="flex items-center border-b border-zinc-100 bg-zinc-50/50 p-2 gap-1 relative">
          <button
            onClick={() => setRightTab("WAREHOUSE")}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-none transition-all ${rightTab === "WAREHOUSE" ? "bg-white text-primary shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Subjects
          </button>
          <button
            onClick={() => setRightTab("GROUPS")}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-none transition-all ${rightTab === "GROUPS" ? "bg-white text-primary shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Groups
            {existingGroups.length > 0 && (
              <span className="ml-1 text-[10px] bg-primary text-white px-2 py-0.5 rounded-none">
                {existingGroups.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setRightTab("TREE")}
            className={`text-xs font-black rounded-none p-4 transition-all ${rightTab === "TREE" ? "bg-white text-primary shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            <Layers size={16} />
          </button>
        </div>

        {rightTab === "WAREHOUSE" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-zinc-100 shrink-0 space-y-2">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-3">
                Warehouse Hub
              </h3>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Database Query..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-3 pl-10 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
                <div className="relative group/dept">
                  <Building
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/dept:text-primary transition-colors"
                    size={14}
                  />
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-none py-3 pl-10 pr-10 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept: any) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {isLoadingSub ? (
                <div className="flex justify-center py-20 text-zinc-300">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : warehouseSubjects.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400 font-bold uppercase tracking-widest">
                  No subjects found
                </div>
              ) : (
                warehouseSubjects.map((s) => (
                  <button
                    key={s.subjectId}
                    onClick={() =>
                      addSubject(s as unknown as CurriculumSubject)
                    }
                    className="w-full bg-white p-4 rounded-none border border-zinc-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-none bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
                      <Box size={12} className="text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-black text-zinc-900">
                            {s.subjectCode}
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 bg-primary/5 text-primary border border-primary/20 rounded-none">
                            {s.credits} Credits
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-zinc-500 leading-snug line-clamp-1">
                        {s.subjectName}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {rightTab === "GROUPS" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">
            <div className="p-6 border-b border-zinc-100 bg-white shadow-sm shrink-0 space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-900 tracking-widest">
                Create Soft Group
              </h3>

              <div className="flex bg-zinc-100 p-1 rounded-none">
                <button
                  onClick={() => setNewGroupType("COMBO")}
                  className={`flex-1 py-2 text-xs font-black uppercase rounded-none transition-all ${newGroupType === "COMBO" ? "bg-indigo-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                >
                  COMBO
                </button>
                <button
                  onClick={() => setNewGroupType("ELECTIVE")}
                  className={`flex-1 py-2 text-xs font-black uppercase rounded-none transition-all ${newGroupType === "ELECTIVE" ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                >
                  ELECTIVE
                </button>
              </div>

              <div className="space-y-2">
                <input
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value)}
                  placeholder="Group Code (e.g. AI-K18)"
                  className="w-full border border-zinc-200 rounded-none p-2 text-xs font-bold outline-none focus:border-indigo-500 transition-colors"
                />
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name (e.g. AI Fundamentals)"
                  className="w-full border border-zinc-200 rounded-none p-2 text-xs font-bold outline-none focus:border-indigo-500 transition-colors"
                />
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Description (Optional)"
                  className="w-full border border-zinc-200 rounded-none p-2 text-xs font-medium outline-none focus:border-indigo-500 resize-none h-16 transition-colors"
                />
                <button
                  onClick={createSoftGroup}
                  disabled={!newGroupCode || !newGroupName || isCreatingGroup}
                  className="w-full bg-zinc-900 text-white p-2.5 flex items-center justify-center gap-2 rounded-none hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all shadow-sm"
                >
                  {isCreatingGroup ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Create Soft Group
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingGroups ? (
                <div className="flex justify-center py-10 text-zinc-300">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : existingGroups.filter((g) => g.type === newGroupType)
                  .length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400 font-bold uppercase tracking-widest border border-dashed rounded-none border-zinc-200">
                  No Groups Initialized
                </div>
              ) : (
                existingGroups
                  .filter((g) => g.type === newGroupType)
                  .map((grp) => (
                    <div
                      key={grp.groupId}
                      className={`p-4 rounded-none border relative shadow-sm ${grp.type === "COMBO" ? "bg-indigo-50/50 border-indigo-100" : "bg-emerald-50/50 border-emerald-100"}`}
                    >
                      <button
                        onClick={() => unlinkGroup(grp.groupId)}
                        className="absolute top-3 right-3 text-zinc-400 hover:text-orange-500"
                        title="Unlink subjects"
                      >
                        <Unlink size={16} />
                      </button>
                      <div className="flex gap-2 items-center mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${grp.type === "COMBO" ? "bg-indigo-600" : "bg-emerald-600"}`}
                        >
                          {grp.type}
                        </span>
                        <h4 className="text-xs font-black text-zinc-900">
                          {grp.code}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-500">{grp.name}</p>
                      <div className="mt-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Mapped Subjects:{" "}
                        {
                          draftSubjects.filter(
                            (ds) => ds.groupId === grp.groupId,
                          ).length
                        }
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {rightTab === "TREE" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">
            <div className="p-6 border-b border-zinc-100 bg-white shadow-sm shrink-0">
              <h3 className="text-sm font-black text-zinc-900 tracking-tight">
                Structured Hierarchy
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              <TreeNode
                label="Curriculum Root"
                icon={<BookOpen size={14} className="text-primary" />}
                defaultOpen={true}
                childrenList={semesters.map((semNum) => {
                  const semSubs = draftSubjects.filter(
                    (s) => s.semester === semNum,
                  );
                  if (semSubs.length === 0) return null;

                  return (
                    <TreeNode
                      key={`sem-tree-${semNum}`}
                      label={`Semester ${semNum}`}
                      defaultOpen={true}
                      childrenList={semSubs.map((sub) => {
                        const group = sub.groupId
                          ? existingGroups.find(
                              (g) => g.groupId === sub.groupId,
                            )
                          : null;
                        const tag = group ? `[${group.code}] ` : "";
                        return (
                          <TreeNode
                            key={sub.subjectId}
                            icon={<FileText size={14} />}
                            label={`${tag}${sub.subjectCode}`}
                          />
                        );
                      })}
                    />
                  );
                })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Validation Summary */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-none shadow-2xl flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                  <span className="text-sm font-black italic">!</span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/50">
                    Curriculum Health
                  </p>
                  <p className="text-sm font-bold text-white">
                    {validationErrors.length} Issue
                    {validationErrors.length > 1 ? "s" : ""} Detected
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <p className="text-xs font-bold text-red-400 max-w-[200px] leading-tight">
                Fix prerequisite conflicts before finalizing the curriculum.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
