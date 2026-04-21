"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FormService, 
  FullFormSchema, 
  FeedbackFormSection, 
  FeedbackFormQuestion,
  FeedbackFormOption 
} from "@/services/form.service";
import { useToast } from "@/components/ui/Toast";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Layers, 
  Layout, 
  Zap, 
  Loader2, 
  MoreVertical,
  PlusCircle,
  GripVertical,
  Settings2,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FormBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const majorCode = params.majorCode as string;
  const formId = params.formId as string;

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const [isPolling, setIsPolling] = useState(false);

  // Full Schema Query
  const { 
    data: schemaRaw, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["form-schema", formId],
    queryFn: () => FormService.getFormFullSchema(formId),
    enabled: !!formId,
    refetchInterval: (data) => {
      const currentSchema = (data as any)?.data || data;
      // Stop polling if active or if we're not in a polling state
      if (currentSchema?.isActive || !isPolling) return false;
      return 3000; // Poll every 3s
    }
  });

  const schema = (schemaRaw as any)?.data || schemaRaw;

  // Stop polling if form becomes active
  useEffect(() => {
    if (schema?.isActive && isPolling) {
      setIsPolling(false);
      showToast("Google Form is now LIVE!", "success");
    }
  }, [schema?.isActive, isPolling, showToast]);

  // Set initial active section
  useEffect(() => {
    if (schema?.sections?.length > 0 && !activeSectionId) {
      setActiveSectionId(schema.sections[0].sectionId);
    }
  }, [schema, activeSectionId]);

  const activeSection = schema?.sections?.find(s => s.sectionId === activeSectionId);

  // Mutators
  const addSectionMutation = useMutation({
    mutationFn: (payload: { title: string; afterSectionAction: string; targetSectionId: string | null }) => 
      FormService.createSection(formId, payload),
    onSuccess: () => {
      showToast("Section created", "success");
      setIsAddingSection(false);
      refetch();
    },
    onError: (err: any) => showToast(err.message || "Failed to add section", "error")
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => FormService.deleteSection(id),
    onSuccess: () => {
      showToast("Section removed", "info");
      if (activeSectionId === deleteSectionMutation.variables) setActiveSectionId(null);
      refetch();
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => FormService.deleteQuestion(id),
    onSuccess: () => {
      showToast("Question removed", "info");
      refetch();
    }
  });

  const publishMutation = useMutation({
    mutationFn: () => FormService.triggerBuild(formId),
    onSuccess: () => {
      showToast("Build triggered! Form generation started.", "success");
      router.push(`/dashboard/hocfdc/manage-majors/${majorCode}?tab=FORMS`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="animate-spin text-zinc-900" size={48} />
        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Compiling Design Data...</p>
      </div>
    );
  }

  if (isError) {
    return (
       <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 text-center space-y-4">
         <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <Trash2 size={32} />
         </div>
         <h2 className="text-xl font-black text-zinc-900">Schema synchronization failed</h2>
         <button onClick={() => router.back()} className="text-zinc-500 font-bold hover:underline">Return to Major Dashboard</button>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-8 w-px bg-zinc-100" />
          <div className="space-y-0.5">
            <h1 className="text-base font-black text-zinc-900 tracking-tight uppercase">
              {schema?.title || "Feedback Form Designer"}
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Design Phase &bull; {schema?.sections?.length || 0} Sections Synchronized
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${
            schema?.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${schema?.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{schema?.isActive ? "Published" : "Draft Status"}</span>
          </div>
          
          {!schema?.isActive && (
            <button 
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || isPolling}
              className="px-8 py-3 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-zinc-900/10 flex items-center gap-2 disabled:opacity-70"
            >
              {publishMutation.isPending || isPolling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} fill="currentColor" />
              )}
              {isPolling ? "Building Google Form..." : "Publish to Google"}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-80px)]">
        {/* ── Sidebar: Sections ── */}
        <aside className="w-[380px] border-r border-zinc-100 bg-white flex flex-col">
          <div className="p-8 pb-4 flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Framework Sections</h3>
            <button 
              onClick={() => setIsAddingSection(true)}
              className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          <div className="px-6 space-y-2 overflow-y-auto no-scrollbar flex-1 pb-10">
            <AnimatePresence mode="popLayout">
              {schema?.sections?.map((section) => (
                <motion.div
                  key={section.sectionId}
                  layout
                  onClick={() => setActiveSectionId(section.sectionId)}
                  className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    activeSectionId === section.sectionId 
                      ? "bg-white border-primary shadow-xl shadow-primary/5" 
                      : "bg-zinc-50/50 border-transparent hover:border-zinc-100 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        activeSectionId === section.sectionId ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-zinc-400 border-zinc-100"
                      }`}>
                        <Layout size={18} />
                      </div>
                      <div className="space-y-1 py-0.5">
                        <p className={`text-sm font-black tracking-tight leading-none ${activeSectionId === section.sectionId ? "text-zinc-900" : "text-zinc-500"}`}>
                          {section.title || `Untitled Section ${section.orderIndex}`}
                        </p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {section.questions?.length || 0} Components
                        </p>
                      </div>
                    </div>
                    {activeSectionId === section.sectionId && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSectionMutation.mutate(section.sectionId); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* ── Main Panel: Questions ── */}
        <main className="flex-1 bg-white overflow-y-auto no-scrollbar p-12">
          {activeSectionId ? (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{activeSectionTitle(activeSection)}</h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                       Order Index #{activeSection?.orderIndex}
                    </span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                       After Section: {activeSection?.afterSectionAction}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingQuestion(true)}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-zinc-900/10 flex items-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add Question
                </button>
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {activeSection?.questions && activeSection.questions.length > 0 ? (
                    activeSection.questions.map((question, qIndex) => (
                      <motion.div
                        key={question.questionId}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="p-8 bg-zinc-50/50 rounded-[2rem] border-2 border-transparent hover:border-zinc-100 hover:bg-white transition-all group relative"
                      >
                        <div className="flex items-start gap-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-900 border border-zinc-100 shadow-sm shrink-0 font-black text-sm">
                            {(qIndex + 1).toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="px-2.5 py-1 bg-white text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-zinc-100">
                                  {question.type}
                                </span>
                                <p className="text-lg font-black text-zinc-900 leading-tight">
                                  {question.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button className="p-2 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
                                  <Settings2 size={18} />
                                </button>
                                <button 
                                  onClick={() => deleteQuestionMutation.mutate(question.questionId)}
                                  className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            
                            {question.options && question.options.length > 0 && (
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                {question.options.map((opt) => (
                                  <div key={opt.optionId} className="px-4 py-2.5 bg-white rounded-xl border border-zinc-100 text-[11px] font-bold text-zinc-500 uppercase tracking-wide flex items-center justify-between">
                                    <span>{opt.text || opt.optionText}</span>
                                    {opt.nextSectionId && (
                                       <span className="text-[9px] text-primary opacity-50">&rarr; Section Goto</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-zinc-300 gap-4 border-2 border-dashed border-zinc-100 rounded-[2rem]">
                      <div className="p-4 bg-zinc-50 rounded-2xl">
                        <HelpCircle size={32} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Void Canvas. Add your first probe.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-200 gap-6">
               <FileText size={80} strokeWidth={1} />
               <div className="text-center space-y-1">
                 <p className="text-sm font-black uppercase tracking-[0.3em]">Schema Engine Idle</p>
                 <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Initialize or Select a Section to proceed</p>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
         {isAddingQuestion && (
           <QuestionCreatorModal 
             sectionId={activeSectionId!} 
             onClose={() => { setIsAddingQuestion(false); refetch(); }}
           />
         )}
      </AnimatePresence>

      {/* Add Section Modal */}
      <AnimatePresence>
         {isAddingSection && (
           <SectionCreatorModal 
             onClose={() => setIsAddingSection(false)}
             onConfirm={(data) => addSectionMutation.mutate(data)}
             sections={schema?.sections || []}
           />
         )}
      </AnimatePresence>
    </div>
  );
}

function SectionCreatorModal({ onClose, onConfirm, sections }: { 
  onClose: () => void; 
  onConfirm: (data: { title: string; afterSectionAction: string; targetSectionId: string | null }) => void;
  sections: FeedbackFormSection[];
}) {
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("NEXT");
  const [targetId, setTargetId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
           <h2 className="text-xl font-black text-zinc-800 tracking-tight">Thêm Section mới</h2>
           <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 font-bold text-xl">&times;</button>
        </div>

        <div className="p-8 space-y-8">
           <div className="bg-blue-600 h-10 -mt-8 -mx-8 mb-4 border-b-4 border-blue-700/20" />
           
           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-zinc-600 block px-1">Tiêu đề Section</label>
                <div className="relative">
                  <input 
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Thông tin chung"
                    className="w-full bg-blue-50/30 border border-zinc-200 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-800 placeholder:text-zinc-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-zinc-600 block px-1">After Section Action</label>
                <div className="relative">
                  <select 
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-white border border-blue-400/30 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-700 appearance-none focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                  >
                    <option value="NEXT">NEXT — Sang section tiếp theo</option>
                    <option value="SUBMIT">SUBMIT — Nộp form</option>
                    <option value="GO_TO_SECTION">GO_TO_SECTION — Nhảy đến section cụ thể</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <Layout size={14} />
                  </div>
                </div>
              </div>

              {action === "GO_TO_SECTION" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Target Section</label>
                  <select 
                    value={targetId || ""}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none"
                  >
                    <option value="">Select Target...</option>
                    {sections.map(s => (
                      <option key={s.sectionId} value={s.sectionId}>{s.title || `Section ${s.orderIndex}`}</option>
                    ))}
                  </select>
                </div>
              )}
           </div>
        </div>

        <div className="px-8 py-6 bg-zinc-50/50 flex items-center justify-end gap-6 border-t border-zinc-100">
           <button 
             onClick={onClose}
             className="text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600"
           >
             Hủy
           </button>
           <button 
             onClick={() => onConfirm({ title, afterSectionAction: action, targetSectionId: targetId })}
             className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
           >
             Thêm Section
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function activeSectionTitle(section: FeedbackFormSection | undefined) {
  if (!section) return "Designer Node";
  return section.title || `Section ${section.orderIndex}`;
}

// Sub-component for Question Creation
function QuestionCreatorModal({ sectionId, onClose }: { sectionId: string; onClose: () => void }) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [type, setType] = useState("RADIO");
  const [isRequired, setIsRequired] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const handleAddOption = () => setOptions([...options, ""]);
  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSave = async () => {
    if (!content) return showToast("Question content is missing", "error");
    setIsPending(true);
    try {
      await FormService.createQuestion(sectionId, {
        content,
        type,
        isRequired,
        options: options.filter(o => o.trim()).map(o => ({ optionText: o }))
      });
      showToast("Question Added", "success");
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to add question", "error");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden overflow-y-auto max-h-[90vh] p-10 no-scrollbar"
      >
        <div className="space-y-8">
          <div className="space-y-2">
             <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Create Component</h3>
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Synthesizing node for Section #{sectionId.slice(0, 4)}</p>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Inquiry / Statement</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all min-h-[100px]"
                  placeholder="Insert question content here..."
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Interaction Model</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/5 outline-none"
                  >
                    <option value="TEXT">SHORT_TEXT — Văn bản ngắn</option>
                    <option value="PARAGRAPH">PARAGRAPH — Văn bản dài</option>
                    <option value="RADIO">RADIO — Chọn một</option>
                    <option value="CHECKBOX">CHECKBOX — Chọn nhiều</option>
                    <option value="DROPDOWN">DROPDOWN — Danh sách thả</option>
                    <option value="SCALE">LINEAR_SCALE — Thang điểm</option>
                    <option value="DATE">DATE — Ngày</option>
                    <option value="TIME">TIME — Giờ</option>
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Prerequisite</label>
                   <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 rounded-xl border border-zinc-100">
                     <input type="checkbox" checked={isRequired} onChange={() => setIsRequired(!isRequired)} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Compulsory Response</span>
                   </div>
                </div>
             </div>

             {["RADIO", "CHECKBOX", "DROPDOWN"].includes(type) && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Options Inventory</label>
                    <button onClick={handleAddOption} className="text-[10px] font-black text-primary uppercase">+ Add Probe</button>
                  </div>
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-5 py-2.5 text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none"
                          placeholder={`Option ${i+1}`}
                        />
                        <button 
                          onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                          className="p-2 text-zinc-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>

          <div className="flex gap-4 pt-4">
             <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cancel</button>
             <button 
              onClick={handleSave}
              disabled={isPending}
              className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-zinc-900/10 disabled:opacity-50"
             >
               {isPending ? "Generating Node..." : "Commit Inquiry"}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
