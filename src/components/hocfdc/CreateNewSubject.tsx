"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  Target,
  Link,
  FileText,
  Eye,
  Save,
  Plus,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  Download,
  BookOpen,
  Building2,
  Layers,
  Clock,
  GraduationCap,
  Sliders,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SubjectService } from "@/services/subject.service";
import { CurriculumSubject } from "@/services/curriculum.service";
import { useToast } from "@/components/ui/Toast";

export default function CreateNewSubject() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<CurriculumSubject>>({
    subjectCode: "",
    subjectName: "",
    credits: 3,
    degreeLevel: "",
    timeAllocation: "",
    description: "",
    studentTasks: "",
    scoringScale: 10,
    minToPass: 5,
    departmentId: "",
    minBloomLevel: 3,
    tool: "",
    mappingPLOs: [],
    prerequisites: [],
  });

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const resp = await SubjectService.getDepartments({ size: 100 });
        setDepartments(resp.data?.content || []);
      } catch (error) {
        console.error("Failed to fetch departments", error);
        setDepartments([]);
      }
    };
    fetchDeps();
  }, []);

  const handleSubmit = async () => {
    // Basic validation
    const requiredFields: Record<string, string> = {
      subjectCode: "Subject Code",
      subjectName: "Subject Name",
      credits: "Credits",
      degreeLevel: "Degree Level",
      timeAllocation: "Time Allocation",
      description: "Subject Description",
      studentTasks: "Student Tasks",
      scoringScale: "Scoring Scale",
      minToPass: "Min. Grade to Pass",
      departmentId: "Department",
    };

    const missingEntries = Object.entries(requiredFields).filter(
      ([key]) => !formData[key as keyof Partial<CurriculumSubject>],
    );

    const missingKeys = missingEntries.map(([key]) => key);
    const missingLabels = missingEntries.map(([, label]) => label);

    if (missingKeys.length > 0) {
      setErrors(missingKeys);
      showToast(`Please complete the following fields!`, "error");
      return;
    }
    setErrors([]);

    setIsSubmitting(true);
    try {
      const payload = {
        subjectCode: formData.subjectCode || "",
        subjectName: formData.subjectName || "",
        minBloomLevel: formData.minBloomLevel || 3,
        credits: formData.credits || 0,
        degreeLevel: formData.degreeLevel || "",
        timeAllocation: formData.timeAllocation || "",
        description: formData.description || "",
        studentTasks: formData.studentTasks || "",
        scoringScale: Number(formData.scoringScale) || 0,
        minToPass: formData.minToPass || 0,
        tool: formData.tool || "",
        departmentId: formData.departmentId || "",
      };

      await SubjectService.createSubject(payload as any);
      showToast("Subject created successfully!", "success");
      router.push("/dashboard/hocfdc/subjects");
    } catch (error) {
      console.error(error);
      showToast("Failed to create subject. Please check your data.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePLO = (ploId: string) => {
    const current = formData.mappingPLOs || [];
    if (current.includes(ploId)) {
      setFormData({
        ...formData,
        mappingPLOs: current.filter((id) => id !== ploId),
      });
    } else {
      setFormData({ ...formData, mappingPLOs: [...current, ploId] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-[30px]">
      <div className="flex justify-between items-end mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/hocfdc/subjects")}
            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
          >
            <ChevronLeft
              className="group-hover:-translate-x-0.5 transition-transform"
              size={20}
            />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">
              <BookOpen size={12} />
              Academic Registry
            </div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
              Create New Subject.
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              Configure core academic modules and strategic alignments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/10 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Create Subject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Main Subject Form */}
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden min-h-[600px]">
          <div className="p-10">
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 grid grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("subjectCode") ? "text-rose-500" : "text-zinc-900"}`}
                    >
                      Subject Code
                    </label>
                    <div className="relative">
                      <input
                        value={formData.subjectCode}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            subjectCode: e.target.value,
                          });
                          if (errors.includes("subjectCode"))
                            setErrors((prev) =>
                              prev.filter((k) => k !== "subjectCode"),
                            );
                        }}
                        placeholder="e.g. PRN231"
                        className={`w-full bg-zinc-50 border rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 outline-none transition-all placeholder:text-zinc-300 ${
                          errors.includes("subjectCode")
                            ? "border-rose-500 focus:ring-rose-500/10"
                            : "border-zinc-100 focus:ring-primary/5"
                        }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("credits") ? "text-rose-500" : "text-zinc-900"}`}
                    >
                      Credits
                    </label>
                    <div className="relative group">
                      <Layers
                        className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors ${errors.includes("credits") ? "text-rose-400" : "text-zinc-300"}`}
                        size={16}
                      />
                      <input
                        type="number"
                        value={formData.credits}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            credits: parseInt(e.target.value),
                          });
                          if (errors.includes("credits"))
                            setErrors((prev) =>
                              prev.filter((k) => k !== "credits"),
                            );
                        }}
                        className={`w-full bg-zinc-50 border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 outline-none transition-all ${
                          errors.includes("credits")
                            ? "border-rose-500 focus:ring-rose-500/10"
                            : "border-zinc-100 focus:ring-primary/5"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("minBloomLevel") ? "text-rose-500" : "text-zinc-900"}`}
                    >
                      Min. Bloom
                    </label>
                    <div className="relative group">
                      <Target
                        className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors ${errors.includes("minBloomLevel") ? "text-rose-400" : "text-zinc-300"}`}
                        size={16}
                      />
                      <select
                        value={formData.minBloomLevel}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            minBloomLevel: parseInt(e.target.value),
                          });
                          if (errors.includes("minBloomLevel"))
                            setErrors((prev) =>
                              prev.filter((k) => k !== "minBloomLevel"),
                            );
                        }}
                        className={`w-full bg-zinc-50 border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 outline-none transition-all appearance-none ${
                          errors.includes("minBloomLevel")
                            ? "border-rose-500 focus:ring-rose-500/10"
                            : "border-zinc-100 focus:ring-primary/5"
                        }`}
                      >
                        {[
                          { level: 1, label: "Level 1: Remember" },
                          { level: 2, label: "Level 2: Understand" },
                          { level: 3, label: "Level 3: Apply" },
                          { level: 4, label: "Level 4: Analyze" },
                          { level: 5, label: "Level 5: Evaluate" },
                          { level: 6, label: "Level 6: Create" },
                        ].map((item) => (
                          <option key={item.level} value={item.level}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("degreeLevel") ? "text-rose-500" : "text-zinc-900"}`}
                    >
                      Degree Level
                    </label>
                    <div className="relative group">
                      <GraduationCap
                        className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors ${errors.includes("degreeLevel") ? "text-rose-400" : "text-zinc-300"}`}
                        size={16}
                      />
                      <select
                        value={formData.degreeLevel}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            degreeLevel: e.target.value,
                          });
                          if (errors.includes("degreeLevel"))
                            setErrors((prev) =>
                              prev.filter((k) => k !== "degreeLevel"),
                            );
                        }}
                        className={`w-full bg-zinc-50 border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 outline-none transition-all appearance-none ${
                          errors.includes("degreeLevel")
                            ? "border-rose-500 focus:ring-rose-500/10"
                            : "border-zinc-100 focus:ring-primary/5"
                        }`}
                      >
                        <option value="" disabled hidden>
                          Select Degree...
                        </option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="Doctor">Doctor</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <label
                    className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("subjectName") ? "text-rose-500" : "text-zinc-900"}`}
                  >
                    Subject Name (Academic English)
                  </label>
                  <input
                    value={formData.subjectName}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        subjectName: e.target.value,
                      });
                      if (errors.includes("subjectName"))
                        setErrors((prev) =>
                          prev.filter((k) => k !== "subjectName"),
                        );
                    }}
                    placeholder="e.g. Cross-platform Application Development"
                    className={`w-full bg-zinc-50 border rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 outline-none transition-all placeholder:text-zinc-300 ${
                      errors.includes("subjectName")
                        ? "border-rose-500 focus:ring-rose-500/10"
                        : "border-zinc-100 focus:ring-primary/5"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("departmentId") ? "text-rose-500" : "text-zinc-900"}`}
                  >
                    Responsible Department
                  </label>
                  <div className="relative group">
                    <Building2
                      className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors ${errors.includes("departmentId") ? "text-rose-400" : "text-zinc-300"}`}
                      size={16}
                    />
                    <select
                      value={formData.departmentId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        });
                        if (errors.includes("departmentId"))
                          setErrors((prev) =>
                            prev.filter((k) => k !== "departmentId"),
                          );
                      }}
                      className={`w-full bg-zinc-50 border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 outline-none transition-all appearance-none ${
                        errors.includes("departmentId")
                          ? "border-rose-500 focus:ring-rose-500/10"
                          : "border-zinc-100 focus:ring-primary/5"
                      }`}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dep) => (
                        <option key={dep.departmentId} value={dep.departmentId}>
                          {dep.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("timeAllocation") ? "text-rose-500" : "text-zinc-900"}`}
                  >
                    Time Allocation
                  </label>
                  <div className="relative group">
                    <Clock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors ${errors.includes("timeAllocation") ? "text-rose-400" : "text-zinc-300"}`}
                      size={16}
                    />
                    <input
                      value={formData.timeAllocation}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          timeAllocation: e.target.value,
                        });
                        if (errors.includes("timeAllocation"))
                          setErrors((prev) =>
                            prev.filter((k) => k !== "timeAllocation"),
                          );
                      }}
                      placeholder="e.g. 3-0-6 (30-0-60)"
                      className={`w-full bg-zinc-50 border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 outline-none transition-all ${
                        errors.includes("timeAllocation")
                          ? "border-rose-500 focus:ring-rose-500/10"
                          : "border-zinc-100 focus:ring-primary/5"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("scoringScale") ? "text-rose-500" : "text-zinc-900"}`}
                    >
                      Scoring Scale
                    </label>
                    <input
                      type="number"
                      value={formData.scoringScale}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          scoringScale: parseInt(e.target.value),
                        });
                        if (errors.includes("scoringScale"))
                          setErrors((prev) =>
                            prev.filter((k) => k !== "scoringScale"),
                          );
                      }}
                      className={`w-full bg-zinc-50 border rounded-2xl py-3 px-6 text-sm font-bold focus:ring-2 outline-none transition-all ${
                        errors.includes("scoringScale")
                          ? "border-rose-500 focus:ring-rose-500/10"
                          : "border-zinc-100 focus:ring-primary/5"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("minToPass") ? "text-rose-500" : "text-zinc-900"}`}
                    >
                      Min. Grade to Pass
                    </label>
                    <input
                      type="number"
                      value={formData.minToPass}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          minToPass: parseInt(e.target.value),
                        });
                        if (errors.includes("minToPass"))
                          setErrors((prev) =>
                            prev.filter((k) => k !== "minToPass"),
                          );
                      }}
                      className={`w-full bg-zinc-50 border rounded-2xl py-3 px-6 text-sm font-bold focus:ring-2 outline-none transition-all ${
                        errors.includes("minToPass")
                          ? "border-rose-500 focus:ring-rose-500/10"
                          : "border-zinc-100 focus:ring-primary/5"
                      }`}
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <label
                    className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("description") ? "text-rose-500" : "text-zinc-900"}`}
                  >
                    Subject Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      });
                      if (errors.includes("description"))
                        setErrors((prev) =>
                          prev.filter((k) => k !== "description"),
                        );
                    }}
                    className={`w-full bg-zinc-50 border rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 outline-none transition-all resize-none placeholder:text-zinc-300 ${
                      errors.includes("description")
                        ? "border-rose-500 focus:ring-rose-500/10"
                        : "border-zinc-100 focus:ring-primary/5"
                    }`}
                    placeholder="Provide a comprehensive academic description..."
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label
                    className={`text-xs font-black uppercase tracking-[0.1em] ml-1 transition-colors ${errors.includes("studentTasks") ? "text-rose-500" : "text-zinc-900"}`}
                  >
                    Expectation of Student Tasks
                  </label>
                  <textarea
                    rows={3}
                    value={formData.studentTasks}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        studentTasks: e.target.value,
                      });
                      if (errors.includes("studentTasks"))
                        setErrors((prev) =>
                          prev.filter((k) => k !== "studentTasks"),
                        );
                    }}
                    className={`w-full bg-zinc-50 border rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 outline-none transition-all resize-none placeholder:text-zinc-300 ${
                      errors.includes("studentTasks")
                        ? "border-rose-500 focus:ring-rose-500/10"
                        : "border-zinc-100 focus:ring-primary/5"
                    }`}
                    placeholder="Describe assignments, labs, projects..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
