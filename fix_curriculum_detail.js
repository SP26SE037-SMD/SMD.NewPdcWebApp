const fs = require('fs');
const path = './src/components/hocfdc/CurriculumDetail.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  `import {
  BookOpen,
  Target,
  Network,
  Layout,
  KanbanSquare,
  CheckCircle2,
  ChevronLeft,
  Loader2,
} from "lucide-react";`,
  `import {
  BookOpen,
  Target,
  Network,
  Layout,
  KanbanSquare,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Search, ShieldCheck, PenTool, Rocket, Archive, FileText, Settings, Layers, Share2
} from "lucide-react";`
);

content = content.replace(
  `import { useQuery } from "@tanstack/react-query";`,
  `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";\nimport { useToast } from "@/components/ui/Toast";`
);

// 2. Add properties inside component
const propertiesHookCode = `  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      CurriculumService.updateCurriculumStatus(id, newStatus as any),
    onSuccess: (res: any) => {
      if (!res || res.status === 1000 || !res.status) {
        showToast("Status updated successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["curriculum-details", id] });
        router.refresh();
      } else {
        showToast(res.message || "Failed to update status", "error");
      }
    },
    onError: (err: any) => showToast(err.message || "Connection error", "error"),
  });

  const handleStatusTransition = (newStatus: string) => {
    if (
      confirm(\`Are you sure you want to transition this framework to \${newStatus.replace("_", " ")}?\`)
    ) {
      statusMutation.mutate(newStatus);
    }
  };

  const { data, isLoading } = useQuery({`;

content = content.replace(
  `  const router = useRouter();\n  const { data, isLoading } = useQuery({`,
  propertiesHookCode
);

const stepperLogic = `
  const ALL_STATUS_ORDER = [
    { id: CURRICULUM_STATUS.DRAFT, label: "Draft", icon: FileText, color: "#94a3b8" },
    { id: CURRICULUM_STATUS.STRUCTURE_REVIEW, label: "Structure Review", icon: Search, color: "#f59e0b" },
    { id: CURRICULUM_STATUS.STRUCTURE_APPROVED, label: "Structure Approved", icon: CheckCircle2, color: "#10b981" },
    { id: CURRICULUM_STATUS.SYLLABUS_DEVELOP, label: "Syllabus Develop", icon: Settings, color: "#3b82f6" },
    { id: CURRICULUM_STATUS.FINAL_REVIEW, label: "Final Review", icon: ShieldCheck, color: "#8b5cf6" },
    { id: CURRICULUM_STATUS.SIGNED, label: "Signed", icon: PenTool, color: "#f43f5e" },
    { id: CURRICULUM_STATUS.PUBLISHED, label: "Published", icon: Rocket, color: "#06b6d4" },
    { id: CURRICULUM_STATUS.ARCHIVED, label: "Archived", icon: Archive, color: "#71717a" },
  ];

  const currentIdx = ALL_STATUS_ORDER.findIndex(
    (s) => s.id === (curriculum?.curriculumStatus || curriculum?.status),
  );
  const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;

  const StatusStepper = () => (
    <div className="relative group/stepper max-w-[550px] mr-4">
      <div className="flex items-center px-4 py-2 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-x-auto no-scrollbar scroll-smooth snap-x">
        {ALL_STATUS_ORDER.map((statusItem, idx) => {
          const isCompleted = idx < safeCurrentIdx;
          const isActive = idx === safeCurrentIdx;
          const Icon = statusItem.icon;

          return (
            <div key={statusItem.id} className="flex items-center snap-center">
              <div className="flex flex-col items-center relative group min-w-[100px]">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    backgroundColor: isCompleted ? "var(--primary)" : isActive ? statusItem.color : "rgb(255, 255, 255)",
                    borderColor: isCompleted ? "var(--primary)" : isActive ? statusItem.color : "rgb(244, 244, 245)",
                    color: isActive || isCompleted ? "white" : "rgb(161, 161, 170)",
                  }}
                  className={\`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-500 z-10 relative\`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </motion.div>
                <motion.span
                  animate={{
                    color: isActive || isCompleted ? "rgb(24, 24, 27)" : "rgb(161, 161, 170)",
                    opacity: isActive || isCompleted ? 1 : 0.6,
                  }}
                  className={\`text-[9px] font-black uppercase tracking-widest mt-1 whitespace-nowrap text-center max-w-[90px] leading-tight\`}
                >
                  {statusItem.label}
                </motion.span>
              </div>
              {idx < ALL_STATUS_ORDER.length - 1 && (
                <div className="w-8 h-[2px] bg-zinc-100 mx-1 rounded-full relative overflow-hidden shrink-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%", backgroundColor: isCompleted ? "var(--primary)" : statusItem.color }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="h-full"
                  />
                  {isActive && (
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 bg-indigo-200/40"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none rounded-l-3xl z-20 opacity-0 group-hover/stepper:opacity-100 transition-opacity" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none rounded-r-3xl z-20 opacity-0 group-hover/stepper:opacity-100 transition-opacity" />
    </div>
  );

  return (`;

content = content.replace(`  return (`, stepperLogic);

// Replace UI Header part
const oldHeaderRegex = /<div className="max-w-\[1400px\] mx-auto px-6 py-4">[\s\S]*?{TABS\.map/;
const newHeader = `<div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm group"
              >
                <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {curriculum.curriculumCode}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-zinc-200" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                    {curriculum.majorName || curriculum.decisionNo || "DRAFT STAGE"}
                  </span>
                </div>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-none">
                  {curriculum.curriculumName}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusStepper />
              
              <div className="flex items-center gap-2">
               {(curriculum.curriculumStatus || curriculum.status) === CURRICULUM_STATUS.STRUCTURE_APPROVED && (
                 <button
                   onClick={() => handleStatusTransition(CURRICULUM_STATUS.SYLLABUS_DEVELOP)}
                   className="px-5 py-2.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-2"
                 >
                   Start Syllabus Development <Layers size={14} />
                 </button>
               )}

               {(curriculum.curriculumStatus || curriculum.status) === CURRICULUM_STATUS.SYLLABUS_DEVELOP && (
                 <button
                   onClick={() => handleStatusTransition(CURRICULUM_STATUS.FINAL_REVIEW)}
                   className="px-5 py-2.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-sm flex items-center gap-2"
                 >
                   Submit Final Review <CheckCircle2 size={14} />
                 </button>
               )}

               {(curriculum.curriculumStatus || curriculum.status) === CURRICULUM_STATUS.SIGNED && (
                 <button
                   onClick={() => handleStatusTransition(CURRICULUM_STATUS.PUBLISHED)}
                   className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-2"
                 >
                   Publish Framework <Share2 size={14} />
                 </button>
               )}
              </div>
            </div>
          </div>

          {/* Premium Tab Bar */}
          <div className="flex gap-2 p-1.5 bg-zinc-100/50 rounded-2xl border border-zinc-200/50 overflow-x-auto no-scrollbar">
            {TABS.map`;

content = content.replace(oldHeaderRegex, newHeader);

fs.writeFileSync(path, content, 'utf8');
console.log('Done modifying CurriculumDetail.tsx');
