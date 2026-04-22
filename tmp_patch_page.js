const fs = require('fs');

const FILE_PATH = 'src/app/dashboard/hocfdc/curriculums/[id]/page.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

const importsToAdd = `
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Network, Layout, KanbanSquare, Target } from "lucide-react";
import PloDefinitionStep from "@/components/hocfdc/create-curriculum/PloDefinitionStep";
import MappingStep from "@/components/hocfdc/create-curriculum/MappingStep";
import CurriculumInfoStep from "@/components/hocfdc/create-curriculum/CurriculumInfoStep";
import { AnimatePresence } from "framer-motion";
`;

content = content.replace('import { useQuery } from', importsToAdd + '\nimport { useQuery } from');
// Remove existing Target from lucide-react if we appended it, but they imported Target already.
// Wait, let's just make it simpler. 

const TABS = `
const TABS = [
  { id: "info", label: "Curriculum Info", icon: BookOpen },
  { id: "plo", label: "PLOs Definition", icon: Target },
  { id: "mapping", label: "PO-PLO Mapping", icon: Network },
  { id: "semester", label: "Semester Structure", icon: Layout },
] as const;
`;

content = content.replace('export default function BuilderPage() {', TABS + '\nexport default function BuilderPage() {');

const hooksToAdd = `

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"info" | "plo" | "mapping" | "semester">("semester");

  const createMutation = useMutation({
    mutationFn: (payload: any) => CurriculumService.updateCurriculum(id, payload),
    onSuccess: (response: any) => {
      showToast("Curriculum identity updated", "success");
      queryClient.invalidateQueries({ queryKey: ["curriculum-details", id] });
    },
    onError: (error: any) => {
        showToast(error?.response?.data?.message || "Operation failed", "error");
    }
  });

  const handleSaveStep1 = (data: any, proceed: boolean = false) => {
    createMutation.mutate(data);
  };
`;

content = content.replace('const { showToast } = useToast();', 'const { showToast } = useToast();' + hooksToAdd);


const oldTarget = `<Target size={16} /> Matrix
              </button>`;
// They wanted to remove matrix button because we have tabs now? Or leave it?
// Let's remove the Matrix button from header
content = content.replace(/<div className="flex bg-zinc-100 p-1 rounded-2xl w-fit items-center gap-1">[\s\S]*?<Share2 size={16} \/>[\s\S]*?<\/button>[\s\S]*?<\/div>/, `<div className="flex bg-zinc-100 p-1 rounded-2xl w-fit items-center gap-1">
              <button
                onClick={() => {
                  const hasPLOs = (curriculum?.plos?.length || 0) > 0;
                  const hasSubjects = initialSubjects.length > 0;

                  if (!hasPLOs || !hasSubjects) {
                    let errorMsg;
                    if (!hasPLOs && !hasSubjects)
                      errorMsg =
                        "Curriculum must have PLOs and at least one mapped subject.";
                    else if (!hasPLOs)
                      errorMsg =
                        "Curriculum framework must have Program Learning Outcomes (PLOs) defined.";
                    else
                      errorMsg =
                        "Curriculum must have at least one subject mapped to the framework.";

                    showToast(errorMsg, "error");
                    return;
                  }
                  router.push(\`/dashboard/hocfdc/curriculums/\${id}/review\`);
                }}
                className="px-6 py-3 bg-zinc-100 text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2.5"
              >
                Submit for Review <Share2 size={16} />
              </button>
            </div>`);

const draftTabs = `
        <div className="flex flex-wrap gap-x-8 gap-y-1 overflow-x-auto no-scrollbar pt-1 border-b border-zinc-200 mb-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={\`relative flex items-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap \${
                    isActive
                      ? "text-primary"
                      : "text-zinc-500 hover:text-zinc-900"
                  }\`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeHorizontalTabDraft"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={14} className={isActive ? "text-primary" : "text-zinc-400"} />
                  {tab.label}
                </button>
              );
            })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full relative min-h-[500px]"
          >
            {activeTab === "info" && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100/50 p-6">
                  <CurriculumInfoStep 
                      onSave={handleSaveStep1}
                      isSaving={createMutation.isPending}
                      initialData={curriculum}
                  />
                </div>
            )}
            {activeTab === "plo" && (
                <div className="rounded-2xl">
                    <PloDefinitionStep curriculumIdProp={id} />
                </div>
            )}
            {activeTab === "mapping" && (
                <div className="rounded-2xl">
                    <MappingStep curriculumIdProp={id} />
                </div>
            )}
            {activeTab === "semester" && (
                <div className="rounded-2xl">
                    <CurriculumBuilder
                       curriculumId={id}
                       initialSubjects={initialSubjects}
                    />
                </div>
            )}
          </motion.div>
        </AnimatePresence>
`;

content = content.replace(/{isDraft \? \([\s\S]*?<\/CurriculumBuilder>\s*\)/, `{isDraft ? (\n      <div className="flex flex-col w-full">\n${draftTabs}\n      </div>\n      )`);


// Remove duplicate lucide-react imports if we caused any errors
const uniqueImports = Array.from(new Set(content.match(/import\s+{([^}]+)}\s+from\s+"lucide-react";/g) || [])).join('\n');
content = content.replace(/import\s+({[^}]+})\s+from\s+"lucide-react";/g, '');
content = `import { ChevronLeft, Layers, Share2, MoreHorizontal, Loader2, Calendar, Target, Rocket, BookOpen, Network, KanbanSquare } from "lucide-react";\n` + content;

fs.writeFileSync(FILE_PATH, content);
console.log('Patched');
