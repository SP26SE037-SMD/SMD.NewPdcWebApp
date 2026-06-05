"use client";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Target,
  Layers,
  GraduationCap,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
  X,
  Edit2,
  Info,
  FileText,
  Circle,
  BookOpen,
} from "lucide-react";
import {
  Subject,
  SubjectService,
  SUBJECT_STATUS,
} from "@/services/subject.service";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubjectPrerequisiteRoadmap } from "./SubjectPrerequisiteRoadmap";
import SyllabusListBySubject from "@/components/hopdc/subjects/SyllabusListBySubject";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { CurriculumService } from "@/services/curriculum.service";
import { CloPloMatrixModal } from "@/components/common/CloPloMatrixModal";
import Link from "next/link";
import { SourceService } from "@/services/source.service";

const STATUS_COLORS: Record<string, string> = {
  [SUBJECT_STATUS.DRAFT]: "text-zinc-600 bg-zinc-50 border-zinc-200",

  [SUBJECT_STATUS.WAITING_SYLLABUS]:
    "text-indigo-600 bg-indigo-50 border-indigo-100",
  [SUBJECT_STATUS.PENDING_REVIEW]:
    "text-amber-600 bg-amber-50 border-amber-100",
  [SUBJECT_STATUS.COMPLETED]:
    "text-emerald-600 bg-emerald-50 border-emerald-100",
  [SUBJECT_STATUS.ARCHIVED]: "text-red-600 bg-red-50 border-red-100",
};

export default function SubjectDetail({
  id,
  initialSubject,
  initialError,
  initialViewMode = "DETAIL",
}: {
  id: string;
  initialSubject?: Subject | null;
  initialError?: string | null;
  initialViewMode?: "DETAIL" | "SYLLABUS";
}) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(
    initialSubject || null,
  );
  const [loading, setLoading] = useState(!initialSubject && !initialError);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  // New UI states
  const [viewMode, setViewMode] = useState<"DETAIL" | "SYLLABUS">(
    initialViewMode,
  );

  // Curriculum mapping states
  const [curriculaList, setCurriculaList] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [loadingCurricula, setLoadingCurricula] = useState(false);
  const [selectedCurriculumForMatrix, setSelectedCurriculumForMatrix] = useState<{ id: string; name: string; code: string } | null>(null);

  const fetchSubject = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await SubjectService.getSubjectById(id);
      setSubject(response.data);
      setError(null);
    } catch (error) {
      setError("Failed to load subject details");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSubject && !initialError) {
      fetchSubject();
    }
  }, [id, initialSubject, initialError]);

  useEffect(() => {
    if (isEditing && departments.length === 0) {
      const fetchDeps = async () => {
        try {
          const resp = await SubjectService.getDepartments({ size: 100 });
          setDepartments(resp.data?.content || []);
        } catch (error) {
          console.error("Failed to fetch departments", error);
        }
      };
      fetchDeps();
    }
  }, [isEditing, departments.length]);

  useEffect(() => {
    const fetchMappedCurricula = async () => {
      if (!subject?.subjectId) return;
      setLoadingCurricula(true);
      try {
        const res = await CurriculumGroupSubjectService.getCurriculaBySubject(
          subject.subjectId,
        );
        if (res && res.data && Array.isArray(res.data)) {
          const curriculaDetails = await Promise.all(
            res.data.map(async (cid) => {
              try {
                const detailRes =
                  await CurriculumService.getCurriculumById(cid);
                const envelope = (detailRes as any)?.data;
                const curriculumData =
                  envelope?.data ?? envelope ?? detailRes;
                if (curriculumData && curriculumData.status !== "DRAFT") {
                  return {
                    id: cid,
                    name: curriculumData.curriculumName || "Unknown",
                    code: curriculumData.curriculumCode || "N/A",
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch curriculum ${cid}:`, err);
              }
              return null;
            }),
          );
          setCurriculaList(
            curriculaDetails.filter(
              (c): c is { id: string; name: string; code: string } =>
                c !== null,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load mapped curricula:", error);
      } finally {
        setLoadingCurricula(false);
      }
    };

    fetchMappedCurricula();
  }, [subject?.subjectId]);

  const handleEditToggle = () => {
    if (!subject) return;
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        credits: subject.credits,
        degreeLevel: subject.degreeLevel,
        timeAllocation: subject.timeAllocation,
        description: subject.description,
        studentTasks: subject.studentTasks,
        scoringScale: subject.scoringScale,
        minToPass: subject.minToPass || 0,
        departmentId: subject.department?.departmentId || "",
        electiveId: "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editFormData) return;
    setIsSaving(true);
    try {
      await SubjectService.updateSubject(id, editFormData);
      await fetchSubject(false);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || "Failed to update subject");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-zinc-400 animate-pulse">
            Loading Subject...
          </p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center px-8">
        <div className="bg-white p-10 rounded-[10px] border border-zinc-100 shadow-xl text-center space-y-6 max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[10px] flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Subject Not Found
            </h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              {error ||
                "We couldn't find the subject details. It might have been relocated or your connection was interrupted."}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/hocfdc/subjects")}
            className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-[10px] hover:bg-emerald-600 transition-all shadow-lg shadow-primary/20"
          >
            Back to Subject List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative overflow-hidden font-sans">
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* Hero Header combining Title & Stats */}
      <div className="relative z-10 pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="p-8 md:p-10 flex flex-col gap-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      if (viewMode === "SYLLABUS")
                        router.push(`/dashboard/hocfdc/subjects/${id}`);
                      else router.push("/dashboard/hocfdc/subjects");
                    }}
                    className="w-11 h-11 flex items-center justify-center bg-white/80 border border-zinc-200/50 rounded-xl text-zinc-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group active:scale-95"
                  >
                    <ChevronLeft
                      className="group-hover:-translate-x-0.5 transition-transform"
                      size={22}
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                        {subject.subjectCode}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {viewMode === "SYLLABUS"
                          ? "SYLLABUS LIST"
                          : subject.department?.departmentName}
                      </span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none mt-2">
                      {subject.subjectName}
                    </h1>
                  </div>
                </div>

                {/* Right side actions and status */}
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 border border-zinc-100 rounded-xl shadow-sm">
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        subject.status === SUBJECT_STATUS.COMPLETED
                          ? "bg-emerald-500"
                          : subject.status === SUBJECT_STATUS.PENDING_REVIEW
                            ? "bg-amber-500"
                            : "bg-zinc-400"
                      }`}
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                      {subject.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {viewMode === "DETAIL" && !isEditing && (
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/hocfdc/subjects/${id}/syllabuses`,
                          )
                        }
                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95"
                      >
                        <FileText size={14} />
                        View Syllabuses
                      </button>
                    )}
                    {viewMode === "DETAIL" &&
                      subject.status === SUBJECT_STATUS.DRAFT && (
                        <button
                          onClick={handleEditToggle}
                          className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                        >
                          {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                          {isEditing ? "Discard" : "Edit Subject"}
                        </button>
                      )}
                    {isEditing ? (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        {isSaving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save Changes
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Quick Stats within Hero */}
              {!isEditing && viewMode === "DETAIL" && (
                <>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent my-2" />
                  <div className="grid grid-cols-4 gap-6">
                    {[
                      {
                        label: "Total Credits",
                        value: subject.credits,
                        icon: Layers,
                        color: "text-indigo-600",
                        bg: "bg-indigo-50",
                      },
                      {
                        label: "Degree Level",
                        value: subject.degreeLevel,
                        icon: GraduationCap,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                      },
                      {
                        label: "Time Allocation",
                        value: subject.timeAllocation,
                        icon: Clock,
                        color: "text-amber-600",
                        bg: "bg-amber-50",
                      },
                      {
                        label: "Scoring Scale",
                        value: `${subject.scoringScale} (Min ${subject.minToPass || 0})`,
                        icon: CheckCircle2,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 group cursor-default"
                      >
                        <div
                          className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-white/50`}
                        >
                          <stat.icon size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                            {stat.label}
                          </p>
                          <p className="text-sm font-bold text-zinc-900">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 relative z-10">
        {viewMode === "DETAIL" ? (
          <>
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-12 gap-8"
                >
                  <div className="col-span-8 bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-10 shadow-xl space-y-10">
                    <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
                      <div className="w-12 h-12 bg-primary/10 rounded-[10px] flex items-center justify-center text-primary">
                        <Edit2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                          Edit Subject
                        </h2>
                        <p className="text-xs text-zinc-500 font-medium">
                          Updating subject configuration for{" "}
                          {subject.subjectCode}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                          Subject Code
                        </label>
                        <input
                          value={editFormData?.subjectCode}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              subjectCode: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-bold focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                          Credits
                        </label>
                        <input
                          type="number"
                          value={editFormData?.credits}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              credits: parseInt(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-bold focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                          Subject Name
                        </label>
                        <input
                          value={editFormData?.subjectName}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              subjectName: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-bold focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">
                          Description
                        </label>
                        <textarea
                          rows={4}
                          value={editFormData?.description}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-medium focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[10px] p-8 text-white space-y-4 shadow-xl shadow-indigo-200">
                      <div className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center text-white">
                        <Info size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em]">
                        Editing Mode
                      </h3>
                      <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                        Review all academic parameters before committing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="detail-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-12 gap-8"
                >
                  <div className="col-span-8 space-y-8">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/60 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 group transition-all hover:bg-white/90">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Target size={20} />
                        </div>
                        <h2 className="text-lg font-black text-zinc-900 tracking-tight uppercase tracking-widest">
                          Subject Description
                        </h2>
                      </div>
                      <div className="space-y-6">
                        <div className="relative">
                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-indigo-100 rounded-full" />
                          <p className="text-[15px] text-zinc-600 leading-relaxed font-medium pl-2">
                            {subject.description}
                          </p>
                        </div>
                        <div className="p-6 bg-emerald-50/50 rounded-[16px] border border-emerald-100/50 group-hover:bg-emerald-50 transition-colors">
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800 mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Student Tasks
                          </h4>
                          <p className="text-[15px] text-zinc-700 leading-relaxed font-medium">
                            {subject.studentTasks}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[20px] border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-4 hover:bg-white/90 transition-all">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
                            <Layers size={20} />
                          </div>
                          <div>
                            <h3 className="mt-1 text-lg font-black text-zinc-900 uppercase tracking-[0.2em]">
                              Prerequisite Subjects
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            router.push("/dashboard/hocfdc/prerequisites")
                          }
                          className="rounded-xl bg-white border border-emerald-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95"
                        >
                          Manage Prerequisites
                        </button>
                      </div>

                      <div className="relative h-[450px] w-full overflow-hidden">
                        <SubjectPrerequisiteRoadmap
                          initialSubjectId={subject.subjectId}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-6">
                    {/* PLO Mapping Section */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/90 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Layers size={16} />
                          </div>
                          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                            Curriculum Mapping
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          {loadingCurricula ? (
                            <div className="flex items-center gap-2 text-zinc-400 py-2">
                              <Loader2 size={14} className="animate-spin" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                Loading mappings...
                              </span>
                            </div>
                          ) : curriculaList.length === 0 ? (
                            <p className="text-xs font-semibold text-zinc-400 italic">
                              No mapped curricula found. This subject is not yet
                              assigned to any curriculum.
                            </p>
                          ) : (
                            <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
                              {curriculaList.map((curr) => (
                                <div
                                  key={curr.id}
                                  onClick={() =>
                                    setSelectedCurriculumForMatrix(curr)
                                  }
                                  className="block p-3.5 bg-white border border-zinc-200 rounded-xl hover:border-indigo-350 hover:shadow-sm transition-all group cursor-pointer"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-wider">
                                        {curr.code}
                                      </span>
                                      <p className="text-sm font-black text-zinc-800 group-hover:text-indigo-600 transition-colors leading-tight mt-1">
                                        {curr.name}
                                      </p>
                                    </div>
                                    <ChevronRight
                                      size={14}
                                      className="text-zinc-450 group-hover:text-indigo-550 group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reference Sources Section */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/90 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                            <BookOpen size={16} />
                          </div>
                          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                            Reference Sources
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {!subject.sources || subject.sources.length === 0 ? (
                          <p className="text-xs font-semibold text-zinc-400 italic">
                            No reference sources mapped to this subject.
                          </p>
                        ) : (
                          <div className="space-y-3.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
                            {subject.sources.map((source) => (
                              <div
                                key={source.sourceId || source.isbn || source.sourceName}
                                className="p-3.5 bg-white border border-zinc-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all group"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                      source.type === "TEXTBOOK" || source.type === "REFERENCE_BOOK"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-blue-50 text-blue-700"
                                    }`}>
                                      {source.type || "REFERENCE"}
                                    </span>
                                    {source.publishedYear && (
                                      <span className="text-[10px] font-bold text-zinc-400">
                                        {source.publishedYear}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-black text-zinc-800 leading-tight pt-1">
                                    {source.sourceName}
                                  </h4>
                                  <p className="text-xs font-semibold text-zinc-500">
                                    Author: {source.author || "N/A"}
                                  </p>
                                  {source.publisher && (
                                    <p className="text-[10px] text-zinc-400 font-medium">
                                      Publisher: {source.publisher}
                                    </p>
                                  )}
                                  {source.url && (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-black text-emerald-600 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                                    >
                                      <span>Link Resource</span>
                                      <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions removed */}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* SYLLABUS VIEW MODE */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-12 gap-8 -mt-8"
          >
            <div className="col-span-12 bg-white/80 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <SyllabusListBySubject subjectId={id} hideHeader={true} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Matrix Modal */}
      <CloPloMatrixModal
        isOpen={!!selectedCurriculumForMatrix}
        onClose={() => setSelectedCurriculumForMatrix(null)}
        subjectId={subject.subjectId}
        curriculum={selectedCurriculumForMatrix}
        showViewCurriculumButton={true}
      />
    </div>
  );
}
