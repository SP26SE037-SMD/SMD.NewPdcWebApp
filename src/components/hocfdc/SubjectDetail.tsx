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
  BookOpen,
  FileText,
  Users,
  CheckSquare,
} from "lucide-react";
import {
  Subject,
  SubjectService,
  SUBJECT_STATUS,
} from "@/services/subject.service";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubjectPrerequisiteRoadmap } from "./SubjectPrerequisiteRoadmap";

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

// --- MOCK DATA ---
const MOCK_CURRICULUMS = [
  {
    id: "curr-1",
    majorName: "Software Engineering",
    majorCode: "SE",
    mappings: [
      { clo: "CLO1: Understand basic concepts", plo: "PLO1.1: Foundations" },
      { clo: "CLO2: Design patterns", plo: "PLO2.3: System Design" },
      { clo: "CLO3: Teamwork", plo: "PLO5.1: Professional Ethics" },
    ],
  },
  {
    id: "curr-2",
    majorName: "Digital Marketing",
    majorCode: "DM",
    mappings: [
      { clo: "CLO1: Understand basic concepts", plo: "PLO3.2: Analytics" },
      { clo: "CLO4: Market research", plo: "PLO4.1: Strategic Planning" },
    ],
  },
];

const MOCK_SYLLABUSES = [
  {
    id: "syll-v2",
    versionName: "Syllabus 2024 - Standard",
    status: "ACTIVE",
    version: "2.0",
    materials: [
      { id: "m1", name: "Core Banking Systems", type: "PDF", date: "2024-01-15", desc: "Main textbook for the course", status: "VERIFIED" },
      { id: "m2", name: "Financial Risk Management", type: "Slides", date: "2024-02-10", desc: "Lecture slides for week 1-5", status: "PENDING" },
    ],
    sessions: [
      { id: "s1", number: 1, title: "Introduction to Banking", method: "Lecture", duration: "90 min", type: "Theory", topic: "Basic operations" },
      { id: "s2", number: 2, title: "Credit Risk Analysis", method: "Workshop", duration: "120 min", type: "Practical", topic: "Scoring models" },
    ],
    assessments: [
      { id: "a1", category: "Quiz", weight: "10%", criteria: "MCQ Test", duration: "15 min", type: "Formative" },
      { id: "a2", category: "Midterm", weight: "30%", criteria: "Essay + Project", duration: "90 min", type: "Summative" },
      { id: "a3", category: "Final Exam", weight: "60%", criteria: "Problem Solving", duration: "120 min", type: "Summative" },
    ],
  },
  {
    id: "syll-v1",
    versionName: "Syllabus 2023 - Archive",
    status: "ARCHIVED",
    version: "1.0",
    materials: [],
    sessions: [],
    assessments: [],
  },
];

export default function SubjectDetail({
  id,
  initialSubject,
  initialError,
}: {
  id: string;
  initialSubject?: Subject | null;
  initialError?: string | null;
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
  const [viewMode, setViewMode] = useState<"DETAIL" | "SYLLABUS">("DETAIL");
  const [selectedMajorForMapping, setSelectedMajorForMapping] = useState<any>(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(MOCK_SYLLABUSES[0]);

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
            Establishing Connection...
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
              Module Missing.
            </h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              {error ||
                "We couldn't find the subject details. It might have been relocated or your connection was interrupted."}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/hocfdc/subjects")}
            className="w-full py-4 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-[10px] hover:bg-primary transition-all shadow-lg shadow-zinc-200"
          >
            Back to Warehouse
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

      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-40 w-full px-8 py-4 bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (viewMode === "SYLLABUS") setViewMode("DETAIL");
                else router.push("/dashboard/hocfdc/subjects");
              }}
              className="w-11 h-11 flex items-center justify-center bg-white border border-zinc-100 rounded-[10px] text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group active:scale-95"
            >
              <ChevronLeft
                className="group-hover:-translate-x-0.5 transition-transform"
                size={22}
              />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-black text-primary/60 uppercase tracking-[0.2em]">
                  {subject.subjectCode}
                </span>
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {viewMode === "SYLLABUS" ? "SYLLABUS EXPLORER" : subject.department?.departmentName}
                </span>
              </div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">
                {subject.subjectName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 border border-white rounded-[10px] shadow-sm">
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

            <div className="h-8 w-px bg-zinc-200/60 mx-2" />

            <div className="flex items-center gap-3">
              {viewMode === "DETAIL" && subject.status === SUBJECT_STATUS.DRAFT && (
                <button
                  onClick={handleEditToggle}
                  className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 text-sm font-black uppercase tracking-widest rounded-[10px] hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                  {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                  {isEditing ? "Discard" : "Modify"}
                </button>
              )}
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-[10px] hover:bg-zinc-900 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Commit
                </button>
              ) : viewMode === "DETAIL" ? (
                <button className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-black uppercase tracking-widest rounded-[10px] hover:bg-primary transition-all shadow-lg shadow-zinc-200 active:scale-95">
                  Publish
                </button>
              ) : (
                <select 
                  value={selectedSyllabus.id}
                  onChange={(e) => setSelectedSyllabus(MOCK_SYLLABUSES.find(s => s.id === e.target.value))}
                  className="px-4 py-2 bg-zinc-900 text-white text-sm font-black uppercase tracking-widest rounded-[10px] border-none focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {MOCK_SYLLABUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.versionName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 relative z-10">
        {viewMode === "DETAIL" ? (
          <>
            {/* Quick Stats Grid */}
            {!isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-6 mb-8"
              >
                {[
                  { label: "Total Credits", value: subject.credits, icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Degree Level", value: subject.degreeLevel, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Time Allocation", value: subject.timeAllocation, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Scoring Scale", value: `${subject.scoringScale} (Min ${subject.minToPass || 0})`, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/70 backdrop-blur-md border border-white p-5 rounded-[10px] shadow-sm flex items-center gap-4 group hover:bg-white transition-all cursor-default"
                  >
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-[10px] flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <p className="text-base font-black text-zinc-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

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
                        <h2 className="text-xl font-black text-zinc-900 tracking-tight">Modify Parameters</h2>
                        <p className="text-xs text-zinc-500 font-medium">Updating subject configuration for {subject.subjectCode}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Subject Code</label>
                        <input
                          value={editFormData?.subjectCode}
                          onChange={(e) => setEditFormData({ ...editFormData, subjectCode: e.target.value })}
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-bold focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Credits</label>
                        <input
                          type="number"
                          value={editFormData?.credits}
                          onChange={(e) => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) })}
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-bold focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Subject Name</label>
                        <input
                          value={editFormData?.subjectName}
                          onChange={(e) => setEditFormData({ ...editFormData, subjectName: e.target.value })}
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-bold focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400 ml-1">Description</label>
                        <textarea
                          rows={4}
                          value={editFormData?.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-[10px] py-4 px-6 text-sm font-medium focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 space-y-6">
                    <div className="bg-zinc-900 rounded-[10px] p-8 text-white space-y-4 shadow-xl shadow-zinc-200">
                      <div className="w-10 h-10 bg-white/10 rounded-[10px] flex items-center justify-center text-primary">
                        <Info size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em]">Editing Mode</h3>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">
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
                    <div className="bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-10 shadow-sm space-y-8 group transition-all hover:bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-[10px] flex items-center justify-center">
                          <Target size={20} />
                        </div>
                        <h2 className="text-lg font-black text-zinc-900 tracking-tight uppercase tracking-widest">Curriculum Overview</h2>
                      </div>
                      <div className="space-y-6">
                        <div className="relative">
                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                          <p className="text-base text-zinc-600 leading-relaxed font-medium pl-2">
                            {subject.description}
                          </p>
                        </div>
                        <div className="p-6 bg-zinc-50/50 rounded-[10px] border border-zinc-100 group-hover:bg-white transition-colors">
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Student's Tasks
                          </h4>
                          <p className="text-sm text-zinc-600 leading-relaxed font-medium">{subject.studentTasks}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-10 shadow-sm space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-[10px] flex items-center justify-center">
                            <Layers size={20} />
                          </div>
                          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-widest">Prerequisites Hub</h3>
                        </div>
                        <button onClick={() => router.push("/dashboard/hocfdc/prerequisites")} className="px-4 py-2 bg-zinc-900 text-[10px] font-black text-white uppercase tracking-widest rounded-[10px] hover:bg-primary transition-all active:scale-95">
                          Manage Engine
                        </button>
                      </div>
                      <div className="h-[450px] w-full bg-zinc-900 rounded-[10px] overflow-hidden relative border-4 border-white shadow-inner">
                        <SubjectPrerequisiteRoadmap initialSubjectId={subject.subjectId} />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-6">
                    <div className="bg-zinc-900 rounded-[10px] p-8 shadow-xl shadow-zinc-200 space-y-8">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] text-center">Institutional Hierarchy</h3>
                      <div className="space-y-4">
                        <div className="bg-white/5 rounded-[10px] p-5 border border-white/5 group hover:bg-white/10 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Department</p>
                          <div className="flex items-center gap-3">
                            <Building2 size={18} className="text-white/60" />
                            <span className="text-base font-bold text-white">{subject.department?.departmentName}</span>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-[10px] p-5 border border-white/5 group hover:bg-white/10 transition-colors">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Academic Level</p>
                          <div className="flex items-center gap-3">
                            <GraduationCap size={18} className="text-white/60" />
                            <span className="text-base font-bold text-white">{subject.degreeLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PLO Mapping Section */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            <Layers size={16} />
                          </div>
                          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                            {selectedMajorForMapping ? "Mapping Details" : "Curriculum Mapping"}
                          </h3>
                        </div>
                        {selectedMajorForMapping && (
                          <button 
                            onClick={() => setSelectedMajorForMapping(null)}
                            className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                          >
                            Back
                          </button>
                        )}
                      </div>

                      <AnimatePresence mode="wait">
                        {selectedMajorForMapping ? (
                          <motion.div
                            key="mapping-detail"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-4"
                          >
                            <div className="p-4 bg-zinc-900 rounded-[10px] mb-4">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{selectedMajorForMapping.majorCode}</p>
                              <p className="text-sm font-bold text-white">{selectedMajorForMapping.majorName}</p>
                            </div>
                            <div className="space-y-3">
                              {selectedMajorForMapping.mappings.map((m: any, idx: number) => (
                                <div key={idx} className="p-3 bg-zinc-50 border border-zinc-100 rounded-[10px]">
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{m.clo}</p>
                                  <p className="text-xs font-bold text-zinc-900 tracking-tight">{m.plo}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="major-list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-3"
                          >
                            {MOCK_CURRICULUMS.map((major) => (
                              <button
                                key={major.id}
                                onClick={() => setSelectedMajorForMapping(major)}
                                className="w-full flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-[10px] hover:border-primary transition-all group shadow-sm"
                              >
                                <div className="text-left">
                                  <p className="text-xs font-black text-primary uppercase tracking-widest mb-0.5">{major.majorCode}</p>
                                  <p className="text-sm font-bold text-zinc-800">{major.majorName}</p>
                                </div>
                                <ChevronRight size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-primary to-emerald-600 rounded-[10px] text-white shadow-lg shadow-primary/20 relative overflow-hidden group">
                      <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-150 duration-700" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80">Management Actions</h4>
                      <div className="space-y-2 relative z-10">
                        <button 
                          onClick={() => setViewMode("SYLLABUS")}
                          className="w-full py-3 bg-white text-primary rounded-[10px] text-sm font-black uppercase tracking-widest hover:shadow-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <BookOpen size={14} />
                          Explore Syllabus Versions
                        </button>
                        <button className="w-full py-3 bg-white/20 backdrop-blur-md rounded-[10px] text-sm font-black uppercase tracking-widest hover:bg-white/30 transition-all border border-white/10 flex items-center justify-center gap-2">
                          <FileText size={14} />
                          Generate Full Report
                        </button>
                      </div>
                    </div>
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
            className="grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 grid grid-cols-3 gap-8">
              {/* Materials Column */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-[10px] flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Materials</h3>
                    <p className="text-xs text-zinc-400 font-bold uppercase">{selectedSyllabus.materials.length} resources</p>
                  </div>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedSyllabus.materials.map((m: any) => (
                    <div key={m.id} className="p-5 bg-zinc-50 border border-zinc-100 rounded-[10px] group hover:bg-white hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 bg-zinc-900 text-[10px] font-black text-white rounded-[10px]">{m.type}</span>
                        <span className="text-xs font-bold text-zinc-400">{m.date}</span>
                      </div>
                      <p className="text-sm font-black text-zinc-900 mb-1">{m.name}</p>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">{m.desc}</p>
                      <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${m.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                           {m.status}
                         </span>
                         <button className="text-xs font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View File</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sessions Column */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-[10px] flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Sessions</h3>
                    <p className="text-xs text-zinc-400 font-bold uppercase">{selectedSyllabus.sessions.length} modules</p>
                  </div>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedSyllabus.sessions.map((s: any) => (
                    <div key={s.id} className="p-5 bg-zinc-900 text-white rounded-[10px] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-4xl font-black">{s.number}</span>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-xs font-black text-primary uppercase tracking-widest">{s.type}</span>
                           <div className="w-1 h-1 rounded-full bg-white/20" />
                           <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{s.duration}</span>
                        </div>
                        <p className="text-sm font-black mb-1 group-hover:text-primary transition-colors">{s.title}</p>
                        <p className="text-xs text-white/50 font-medium mb-4 italic">"{s.topic}"</p>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest">{s.method}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessments Column */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[10px] border border-white p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-[10px] flex items-center justify-center">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Assessments</h3>
                    <p className="text-xs text-zinc-400 font-bold uppercase">Weight: 100%</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedSyllabus.assessments.map((a: any) => (
                    <div key={a.id} className="p-5 border border-zinc-100 rounded-[10px] hover:border-primary/30 transition-all flex items-center justify-between bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-[10px] flex flex-col items-center justify-center border border-zinc-100">
                          <span className="text-[10px] font-black text-zinc-900 tracking-tighter">{a.weight}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900 mb-0.5">{a.category}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{a.type}</span>
                             <div className="w-1 h-1 rounded-full bg-zinc-200" />
                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{a.duration}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300" />
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-zinc-50 rounded-[10px] border border-dashed border-zinc-200 text-center">
                   <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Grading Policy</p>
                   <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">"Must achieve min score of {subject.minToPass} on all summative components."</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
