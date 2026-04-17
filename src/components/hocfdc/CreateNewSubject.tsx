"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SubjectService } from "@/services/subject.service";
import { CurriculumSubject } from "@/services/curriculum.service";
import { useToast } from "@/components/ui/Toast";

const INITIAL_FORM_DATA: Partial<CurriculumSubject> = {
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
};

export default function CreateNewSubject() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<CurriculumSubject>>(INITIAL_FORM_DATA);

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

  const handleInputChange = (field: keyof CurriculumSubject, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors.includes(field)) {
      setErrors((prev) => prev.filter((k) => k !== field));
    }
  };

  const handleDiscard = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors([]);
    showToast("Form progress reset.", "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (missingKeys.length > 0) {
      setErrors(missingKeys);
      showToast(`Please complete all required fields!`, "error");
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

  return (
    <div className="p-12 max-w-6xl mx-auto animate-in fade-in duration-700">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#5a6062] mb-6 font-medium uppercase tracking-wider">
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.push("/dashboard/hocfdc")}>Portal</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="cursor-pointer hover:text-primary transition-colors font-bold text-zinc-800" onClick={() => router.push("/dashboard/hocfdc/subjects")}>Subjects</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">Create New Subject</span>
      </nav>

      {/* Header Area */}
      <div className="mb-12 flex items-start gap-6">
        <button 
          onClick={() => router.push("/dashboard/hocfdc/subjects")}
          className="mt-1 w-12 h-12 rounded-2xl bg-white border border-[#ebeef0] flex items-center justify-center text-[#5a6062] hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        </button>
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#2d3335] mb-3 font-headline">
            Define New Academic Subject
          </h2>
          <p className="text-[#5a6062] text-lg max-w-2xl leading-relaxed">
            Fill in the essential academic parameters to register this subject in the central repository. 
            All fields marked with an asterisk are required for syllabus generation.
          </p>
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section: Basic Identification */}
        <div className="bg-white rounded-2xl p-10 border border-[#ebeef0] shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ring-1 ring-black/5">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-4">
              <div className="w-12 h-12 bg-[#b1f0ce] text-[#1d5c42] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2d3335]">Subject Identity</h3>
              <p className="text-sm text-[#5a6062] leading-relaxed">
                Establish the unique identifiers and departmental ownership for this unit.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
              <div className="col-span-1 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("subjectCode") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Subject Code *
                </label>
                <input 
                  value={formData.subjectCode}
                  onChange={(e) => handleInputChange("subjectCode", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold placeholder:text-[#adb3b5] ${errors.includes("subjectCode") ? "border-rose-100 placeholder:text-rose-300" : "border-transparent focus:border-primary/20"}`}
                  placeholder="e.g., PRN231" 
                  type="text"
                />
              </div>
              <div className="col-span-1 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("degreeLevel") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Degree Level *
                </label>
                <select 
                  value={formData.degreeLevel}
                  onChange={(e) => handleInputChange("degreeLevel", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold appearance-none cursor-pointer ${errors.includes("degreeLevel") ? "border-rose-100" : "border-transparent focus:border-primary/20"}`}
                >
                  <option value="" disabled hidden>Select Degree...</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="Doctor">Doctor</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("subjectName") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Subject Name *
                </label>
                <input 
                  value={formData.subjectName}
                  onChange={(e) => handleInputChange("subjectName", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold placeholder:text-[#adb3b5] ${errors.includes("subjectName") ? "border-rose-100 placeholder:text-rose-300" : "border-transparent focus:border-primary/20"}`}
                  placeholder="e.g., Advanced Quantum Mechanics II" 
                  type="text"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("departmentId") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Responsible Department *
                </label>
                <select 
                  value={formData.departmentId}
                  onChange={(e) => handleInputChange("departmentId", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold appearance-none cursor-pointer ${errors.includes("departmentId") ? "border-rose-100" : "border-transparent focus:border-primary/20"}`}
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
          </div>
        </div>

        {/* Section: Academic Weights */}
        <div className="bg-white rounded-2xl p-10 border border-[#ebeef0] shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ring-1 ring-black/5">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-4">
              <div className="w-12 h-12 bg-[#d5e8ce] text-[#465643] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2d3335]">Credit & Timing</h3>
              <p className="text-sm text-[#5a6062] leading-relaxed">
                Define the academic load and contact hours expected for student completion.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
              <div className="col-span-1 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("credits") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Credits *
                </label>
                <div className="relative">
                  <input 
                    value={formData.credits}
                    onChange={(e) => handleInputChange("credits", parseInt(e.target.value) || 0)}
                    className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold ${errors.includes("credits") ? "border-rose-100" : "border-transparent focus:border-primary/20"}`}
                    type="number" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#5a6062] bg-[#dee3e6] px-2 py-1 rounded-lg uppercase tracking-wider">ECTS</span>
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("timeAllocation") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Time Allocation (L-T-P) *
                </label>
                <input 
                  value={formData.timeAllocation}
                  onChange={(e) => handleInputChange("timeAllocation", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold text-center tracking-widest placeholder:text-[#adb3b5] ${errors.includes("timeAllocation") ? "border-rose-100 placeholder:text-rose-300" : "border-transparent focus:border-primary/20"}`}
                  placeholder="e.g., 3-0-6" 
                  type="text"
                />
                <p className="mt-2 text-[10px] text-[#5a6062] italic font-medium">Lecture - Tutorial - Practical</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Quality & Assessment */}
        <div className="bg-white rounded-2xl p-10 border border-[#ebeef0] shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ring-1 ring-black/5">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2d3335]">Assessment Matrix</h3>
              <p className="text-sm text-[#5a6062] leading-relaxed">
                Set the rigorous standards for mastery and grade calculations.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#5a6062] ml-1">
                  Minimum Bloom's Taxonomy Level *
                </label>
                <select 
                  value={formData.minBloomLevel}
                  onChange={(e) => handleInputChange("minBloomLevel", parseInt(e.target.value) || 3)}
                  className="w-full bg-[#f1f4f5] border-transparent border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 transition-all text-[#2d3335] font-bold appearance-none cursor-pointer"
                >
                  {[
                    { level: 1, label: "Level 1: Remember" },
                    { level: 2, label: "Level 2: Understand" },
                    { level: 3, label: "Level 3: Apply" },
                    { level: 4, label: "Level 4: Analyze" },
                    { level: 5, label: "Level 5: Evaluate" },
                    { level: 6, label: "Level 6: Create" },
                  ].map((item) => (
                    <option key={item.level} value={item.level}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("scoringScale") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Scoring Scale *
                </label>
                <input 
                  value={formData.scoringScale}
                  onChange={(e) => handleInputChange("scoringScale", parseInt(e.target.value) || 0)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold ${errors.includes("scoringScale") ? "border-rose-100" : "border-transparent focus:border-primary/20"}`}
                  type="number"
                />
              </div>
              <div className="col-span-1 space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("minToPass") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Min. Grade to Pass *
                </label>
                <input 
                  value={formData.minToPass}
                  onChange={(e) => handleInputChange("minToPass", parseInt(e.target.value) || 0)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] font-bold ${errors.includes("minToPass") ? "border-rose-100" : "border-transparent focus:border-primary/20"}`}
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Subject Details (NEW BENTO CARD) */}
        <div className="bg-white rounded-2xl p-10 border border-[#ebeef0] shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ring-1 ring-black/5">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-4">
              <div className="w-12 h-12 bg-[#fcfeb9] text-[#60622d] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#2d3335]">Subject Details</h3>
              <p className="text-sm text-[#5a6062] leading-relaxed">
                Provide comprehensive descriptions of the course content and student expectations.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("description") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Subject Description *
                </label>
                <textarea 
                  rows={5}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] placeholder:text-[#adb3b5] resize-none ${errors.includes("description") ? "border-rose-100 placeholder:text-rose-300" : "border-transparent focus:border-primary/20"}`}
                  placeholder="Provide a comprehensive academic description..."
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest transition-colors ${errors.includes("studentTasks") ? "text-rose-500" : "text-[#5a6062]"} ml-1`}>
                  Expectation of Student Tasks *
                </label>
                <textarea 
                  rows={4}
                  value={formData.studentTasks}
                  onChange={(e) => handleInputChange("studentTasks", e.target.value)}
                  className={`w-full bg-[#f1f4f5] border-2 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-[#2d3335] placeholder:text-[#adb3b5] resize-none ${errors.includes("studentTasks") ? "border-rose-100 placeholder:text-rose-300" : "border-transparent focus:border-primary/20"}`}
                  placeholder="Describe assignments, labs, projects..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-12 border-t border-[#ebeef0]">
          <div className="flex items-center gap-3 text-[#5a6062]">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-sm font-medium uppercase tracking-tight opacity-70">Draft progress is synced until explicit submission.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleDiscard}
              className="px-8 py-3 rounded-xl font-bold text-[#5a6062] hover:bg-[#ebeef0] transition-colors border-2 border-transparent active:scale-95"
            >
              Discard Draft
            </button>
            <button 
              disabled={isSubmitting}
              className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-[#1f5e44] text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50" 
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Create Subject</span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Footer Design Element */}
      <div className="mt-24 grid grid-cols-3 gap-6">
        <div className="col-span-2 relative h-56 rounded-[2rem] overflow-hidden group shadow-2xl">
          <img 
            alt="Collaboration space" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#014931]/90 via-[#014931]/30 to-transparent"></div>
          <div className="absolute bottom-10 left-10 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b1f0ce] mb-2">Subject Governance</p>
            <h4 className="text-3xl font-extrabold tracking-tight">Curriculum Analytics</h4>
            <p className="text-[#e6ffee] text-sm opacity-80 mt-2 max-w-sm">Review how this subject fits into the degree roadmap and strategic learning goals.</p>
          </div>
        </div>
        <div className="col-span-1 bg-[#b1f0ce] rounded-[2rem] p-8 flex flex-col justify-between shadow-xl">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm hover:rotate-12 transition-transform cursor-pointer">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <p className="text-[#014931] font-black text-2xl tracking-tighter">AI Assistant</p>
            <p className="text-[#29664c] text-xs font-medium mt-2 leading-relaxed opacity-80 uppercase tracking-widest">
              Ready to help generate syllabus content once defined.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
