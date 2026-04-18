const fs = require('fs');
const path = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx';
let data = fs.readFileSync(path, 'utf8');

// Import
data = data.replace(
  /import CurriculumInfo from "@\/components\/vp\/curriculum-info";/g,
  'import CurriculumInfo from "@/components/vp/curriculum-info";\nimport MappingMatrix from "@/components/vp/mapping-matrix";'
);

data = data.replace(
  /<button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Mapping Matrix<\/button>/g,
  `<button 
                            className={\`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative \${activeTab === "mapping" ? "text-primary" : "text-on-surface-variant hover:text-primary"}\`}
                            onClick={() => setActiveTab("mapping")}
                        >
                            Mapping Matrix
                            {activeTab === "mapping" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
                        </button>`
);

data = data.replace(
  /\{activeTab === "curriculum" && \(\s*<CurriculumInfo curriculumId=\{curriculum\?\.curriculumId\} \/>\s*\)\}/g,
  `{activeTab === "curriculum" && (
                        <CurriculumInfo curriculumId={curriculum?.curriculumId} />
                    )}

                    {activeTab === "mapping" && (
                        <MappingMatrix curriculumId={curriculum?.curriculumId} />
                    )}`
);

fs.writeFileSync(path, data);
