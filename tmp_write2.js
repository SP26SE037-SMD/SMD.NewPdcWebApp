const fs = require('fs');
const file = `/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx`;

let content = fs.readFileSync(file, 'utf8');

// We need to add the import for CurriculumInfo
if (!content.includes('import CurriculumInfo')) {
  // Find the place after other imports
  content = content.replace(
    'import { useQuery } from "@tanstack/react-query";',
    'import { useQuery } from "@tanstack/react-query";\nimport CurriculumInfo from "@/components/vp/curriculum-info";\nimport { useState } from "react";'
  );
}

// Update the component signature to use activeTab
if (!content.includes('const [activeTab')) {
  content = content.replace(
    'const poList = poRes?.data?.content || [];',
    'const poList = poRes?.data?.content || [];\n    const [activeTab, setActiveTab] = useState("overview");'
  );
}

// Replace the static tabs with active tab logic
const oldTabsStart = `<div className="flex gap-8 mb-12 border-b-0 ml-4 overflow-x-auto no-scrollbar">`;
const oldTabsEnd = `</div>\n\n                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">`;

const newTabs = `<div className="flex gap-8 mb-12 border-b-0 ml-4 overflow-x-auto no-scrollbar relative">
                        <button 
                            className={\`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative \${activeTab === "overview" ? "text-primary" : "text-on-surface-variant hover:text-primary"}\`}
                            onClick={() => setActiveTab("overview")}
                        >
                            Major Overview
                            {activeTab === "overview" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
                        </button>
                        <button 
                            className={\`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative \${activeTab === "curriculum" ? "text-primary" : "text-on-surface-variant hover:text-primary"}\`}
                            onClick={() => setActiveTab("curriculum")}
                        >
                            Curriculum Info
                            {activeTab === "curriculum" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
                        </button>
                        <button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Mapping Matrix</button>
                        <button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Semester Structure</button>
                    </div>

                    {activeTab === "curriculum" && (
                        <CurriculumInfo curriculumId={curriculum?.curriculumId} />
                    )}

                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">`;

// Fix the closing tags.
// Since we wrapped the main content in {activeTab === "overview" && ( ... )}
// We need to add the closing )} at the end
const closingOld = `</div>
                </div>
            </main>
        </div>
    );`;

const closingNew = `</div>
                    )}
                </div>
            </main>
        </div>
    );`;

if (content.includes(oldTabsStart) && !content.includes('setActiveTab("overview")')) {
  // Extract the regex matching the full tabs
  const reTabs = /<div className="flex gap-8 mb-12 border-b-0 ml-4 overflow-x-auto no-scrollbar">[\s\S]*?<\/div>[\s\n]*<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">/;
  content = content.replace(reTabs, newTabs);
  content = content.replace(closingOld, closingNew);
}

fs.writeFileSync(file, content);
