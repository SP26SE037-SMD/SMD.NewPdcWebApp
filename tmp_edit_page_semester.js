const fs = require('fs');
const path = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx';
let data = fs.readFileSync(path, 'utf8');

// Import
data = data.replace(
  /import MappingMatrix from "@\/components\/vp\/mapping-matrix";/g,
  'import MappingMatrix from "@/components/vp/mapping-matrix";\nimport SemesterStructure from "@/components/vp/semester-structure";'
);

data = data.replace(
  /<button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Semester Structure<\/button>/g,
  `<button 
                            className={\`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative \${activeTab === "semester" ? "text-primary" : "text-on-surface-variant hover:text-primary"}\`}
                            onClick={() => setActiveTab("semester")}
                        >
                            Semester Structure
                            {activeTab === "semester" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
                        </button>`
);

data = data.replace(
  /\{activeTab === "mapping" && \(\s*<MappingMatrix curriculumId=\{curriculum\?\.curriculumId\} \/>\s*\)\}/g,
  `{activeTab === "mapping" && (
                        <MappingMatrix curriculumId={curriculum?.curriculumId} />
                    )}

                    {activeTab === "semester" && (
                        <SemesterStructure curriculumId={curriculum?.curriculumId} />
                    )}`
);

fs.writeFileSync(path, data);
