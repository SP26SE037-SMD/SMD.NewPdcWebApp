import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MajorService, Major } from "@/services/major.service";
import StepNavigation from "./StepNavigation";
import {
  Loader2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  Edit3,
  Save,
  FileEdit,
} from "lucide-react";

interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
  onSave?: (data: any, proceedNext?: boolean) => void;
  isSaving?: boolean;
  initialData?: any;
}

export default function CurriculumInfoStep({
  onNext,
  onBack,
  onSave,
  isSaving = false,
  initialData,
}: StepProps) {
  const currentYear = new Date().getFullYear();
  const isEditMode = !!initialData?.curriculumId;

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    startYear: currentYear.toString(),
    majorId: "",
    description: "",
  });

  const [lastSavedData, setLastSavedData] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (initialData) {
      const data = {
        code: initialData.curriculumCode || "",
        name: initialData.curriculumName || "",
        startYear: (initialData.startYear || currentYear).toString(),
        majorId: initialData.majorId || initialData.major?.majorId || "",
        description: initialData.description || "",
      };
      setFormData(data);
      setLastSavedData(JSON.stringify(data));
    }
  }, [initialData, currentYear]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== lastSavedData;
  }, [formData, lastSavedData]);

  const { data: majorData, isLoading: isLoadingMajors } = useQuery({
    queryKey: ["all-majors-non-draft"],
    queryFn: () => MajorService.getMajors({ size: 1000 }), 
  });

  const majors = useMemo(() => {
    const rawMajors = majorData?.data?.content || [];
    return rawMajors.filter((m: Major) => m.status !== "DRAFT");
  }, [majorData]);

  const validation = useMemo(() => {
    return {
      isCurriculumCodeValid:
        formData.code.length > 0 &&
        formData.code === formData.code.toUpperCase() &&
        /[A-Z]/.test(formData.code),
      isMajorSelected: formData.majorId.length > 0,
      isStartYearValid: parseInt(formData.startYear) >= 2020,
      isDescriptionValid: formData.description.trim().length > 0,
    };
  }, [formData]);

  const isFormValid = useMemo(() => {
    return Object.values(validation).every((v) => v === true);
  }, [validation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveOnly = () => {
    if (!isFormValid) return;
    onSave?.({
      curriculumCode: formData.code,
      curriculumName: formData.name,
      startYear: parseInt(formData.startYear),
      majorId: formData.majorId,
      description: formData.description,
    }, false);
  };

  const handleNextClick = () => {
    if (isDirty && isFormValid) setShowConfirmModal(true);
    else onNext?.();
  };

  const confirmAndProceed = () => {
    setShowConfirmModal(false);
    onSave?.({
      curriculumCode: formData.code,
      curriculumName: formData.name,
      startYear: parseInt(formData.startYear),
      majorId: formData.majorId,
      description: formData.description,
    }, true);
  };

  return (
    <div className="min-h-screen px-4 md:px-12 pb-20 pt-10 relative">
      <header className="mb-12 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isEditMode ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {isEditMode ? "Draft Mode" : "Initial Draft"}
             </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
            {isEditMode ? "Update Curriculum Info" : "Curriculum Information"}
          </h1>
          <p className="text-zinc-500 max-w-2xl leading-relaxed font-medium">Establish the institutional identity and academic alignment of this curriculum draft.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1 mr-2">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDirty ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}>
              {isDirty ? "● Unsaved Changes" : "● Info Synced"}
            </span>
          </div>
          <button 
            onClick={handleSaveOnly}
            disabled={!isFormValid || isSaving || !isDirty}
            className={`btn-pdcm-ghost px-8 py-4 rounded-2xl ${!isFormValid || isSaving || !isDirty ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isEditMode ? "Update Draft" : "Save Draft"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 max-w-5xl mx-auto">
        <section className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0px_20px_50px_rgba(0,0,0,0.03)] border border-zinc-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                {isEditMode ? <FileEdit className="text-primary-600" size={24} /> : <Edit3 className="text-primary-600" size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{isEditMode ? "Update Identity" : "Structural Identity"}</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Core Attributes</p>
              </div>
            </div>

            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Curriculum Code</label>
                  <input name="code" value={formData.code} onChange={handleInputChange} className={`w-full bg-zinc-50/50 border-2 rounded-2xl py-4 px-6 font-bold text-zinc-900 placeholder:text-zinc-300 outline-none transition-all duration-300 ${formData.code.length > 0 && !validation.isCurriculumCodeValid ? "border-amber-200 focus:border-amber-400 focus:bg-amber-50/10" : "border-zinc-100 focus:border-primary-300 focus:bg-white focus:shadow-lg focus:shadow-primary/5"}`} placeholder="E.G. SE-K18" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Curriculum Name</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-zinc-50/50 border-2 border-zinc-100 rounded-2xl py-4 px-6 font-bold text-zinc-900 placeholder:text-zinc-300 outline-none transition-all duration-300 focus:border-primary-300 focus:bg-white focus:shadow-lg focus:shadow-primary/5" placeholder="Software Engineering" type="text" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Academic Major</label>
                  <div className="relative group">
                    <select name="majorId" value={formData.majorId} onChange={handleInputChange} className={`w-full bg-zinc-50/50 border-2 border-zinc-100 rounded-2xl py-4 px-6 font-bold appearance-none outline-none transition-all duration-300 cursor-pointer ${formData.majorId ? "text-zinc-900" : "text-zinc-300"} focus:border-primary-300 focus:bg-white focus:shadow-lg focus:shadow-primary/5`}>
                      <option value="" className="text-zinc-300 font-medium italic">Select Major (Non-Draft)</option>
                      {majors.map((m: Major) => <option key={m.majorId} value={m.majorId} className="text-zinc-900 font-bold">{m.majorName} ({m.majorCode})</option>)}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 group-focus-within:rotate-180 group-focus-within:text-primary">
                      {isLoadingMajors ? <Loader2 className="animate-spin text-primary" size={18} /> : <ChevronDown className={`transition-colors duration-300 ${formData.majorId ? "text-primary" : "text-zinc-300"}`} size={20} />}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Effective Start Year</label>
                  <input name="startYear" value={formData.startYear} onChange={handleInputChange} className={`w-full bg-zinc-50/50 border-2 rounded-2xl py-4 px-6 font-bold text-zinc-900 placeholder:text-zinc-300 outline-none transition-all duration-300 ${!validation.isStartYearValid ? "border-red-100 focus:border-red-300 focus:bg-red-50/10" : "border-zinc-100 focus:border-primary-300 focus:bg-white focus:shadow-lg focus:shadow-primary/5"}`} placeholder={currentYear.toString()} type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Institutional Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-zinc-50/50 border-2 border-zinc-100 rounded-2xl py-5 px-6 font-bold text-zinc-900 placeholder:text-zinc-300 outline-none transition-all duration-300 focus:border-primary-300 focus:bg-white focus:shadow-lg focus:shadow-primary/5 resize-none" placeholder="Summarize the core objectives and professional alignment..." rows={5}></textarea>
              </div>
            </form>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white rounded-2xl p-8 border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] sticky top-10">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black text-zinc-900 text-[10px] uppercase tracking-[0.2em]">Configuration Audit</h4>
            </div>
            <ul className="space-y-6">
              {[
                { valid: validation.isCurriculumCodeValid, label: "Uppercase Identity Code" },
                { valid: validation.isMajorSelected, label: "Academic Major Linked" },
                { valid: validation.isStartYearValid, label: "Effective Date Check" },
                { valid: validation.isDescriptionValid, label: "Institutional Summary" }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center mt-0.5 shrink-0 transition-all duration-500 ${item.valid ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "bg-zinc-50 border-2 border-zinc-100"}`}>
                    {item.valid && <CheckCircle2 size={14} strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-bold transition-colors duration-300 ${item.valid ? "text-primary-700" : "text-zinc-400"}`}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <StepNavigation onNext={handleNextClick} showBack={false} />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-100">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-8"><CheckCircle2 className="text-primary-600" size={32} /></div>
            <h3 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight">{isEditMode ? "Update Identity?" : "Confirm Identity?"}</h3>
            <p className="text-zinc-500 leading-relaxed mb-10 font-medium">
              {isEditMode ? "Synchronizing your changes with the existing curriculum draft." : "Saving this identity will establish the structural baseline for all following curriculum modules."}
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="btn-pdcm-ghost flex-1 py-4 px-6 border-none">Review</button>
              <button onClick={confirmAndProceed} disabled={isSaving} className="flex-1 py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isEditMode ? "Update & Next" : "Save & Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
