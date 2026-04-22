const fs = require('fs');

const FILE_PATH = 'src/app/dashboard/hocfdc/curriculums/[id]/page.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

const regex = /<div className="flex bg-zinc-100 p-1 rounded-2xl w-fit items-center gap-1">[\s\S]*?<Target size={16} \/> Matrix[\s\S]*?<\/button>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\)}\s*{\/\* Dynamic Branching based on Status \*\/}\s*{isDraft \? \([\s\S]*?<\/CurriculumBuilder>\s*\)/;

const newString = `<div className="flex bg-zinc-100 p-1 rounded-2xl w-fit items-center gap-1">
$1</div>
          </div>
        </div>
      )}

      {/* Dynamic Branching based on Status */}
      {isDraft ? (
        <div className="flex flex-col w-full">
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
                  <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
                    <CurriculumInfoStep 
                        onSave={handleSaveStep1}
                        isSaving={createMutation.isPending}
                        initialData={curriculum}
                    />
                  </div>
              )}
              {activeTab === "plo" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
                      <PloDefinitionStep curriculumIdProp={id} />
                  </div>
              )}
              {activeTab === "mapping" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
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
        </div>
      )`;

content = content.replace(regex, newString);

fs.writeFileSync(FILE_PATH, content);
console.log('Patched');
