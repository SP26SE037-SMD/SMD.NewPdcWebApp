const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/semester-structure.tsx';
let content = fs.readFileSync(file, 'utf8');

const calcFunc = `
const calculateCredits = (mappings: any[]) => {
    let total = 0;
    let core = 0;
    let electives = 0;
    let genEd = 0;

    mappings.forEach((mapping) => {
        mapping.subjects?.forEach((subject: any) => {
            const credit = Number(subject.credit) || Number(subject.credits) || 0;
            total += credit;
            const name = (subject.subjectName || "").toLowerCase();
            const groupName = (subject.groupName || subject.groupType || "").toLowerCase();
            
            if (name.includes("elective") || groupName.includes("elective")) {
                electives += credit;
            } else if (name.includes("gen ed") || name.includes("general") || groupName.includes("general")) {
                genEd += credit;
            } else {
                core += credit;
            }
        });
    });

    return { total, core, electives, genEd };
};
`;

if (!content.includes('calculateCredits')) {
    content = content.replace('export default function SemesterStructure({', calcFunc + '\nexport default function SemesterStructure({');
}

const hookStr = `const yearKeys = Object.keys(groupedByYear)\n                .map(Number)\n                .sort((a, b) => a - b);\n\n        const credits = calculateCredits(mappings);`;
content = content.replace('const yearKeys = Object.keys(groupedByYear)\n                .map(Number)\n                .sort((a, b) => a - b);', hookStr);

const sidebarOld = `<aside className="col-span-12 xl:col-span-4 space-y-6">
                                {/* Curriculum Summary Card */}
                                <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm ring-1 ring-black/[0.03]">
                                        <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">
                                                Curriculum Summary
                                        </h3>
                                        <div className="mb-8">
                                                <span className="text-5xl font-extrabold text-on-surface tracking-tighter">
                                                        128
                                                </span>
                                                <span className="text-on-surface-variant font-medium ml-2 uppercase text-xs tracking-widest">
                                                        Total Credits
                                                </span>
                                        </div>
                                        <div className="space-y-4 pt-6 border-t border-surface-container">
                                                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                                                        Credit Distribution
                                                </h4>
                                                <div className="space-y-3">
                                                        <div>
                                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                                        <span className="text-on-surface">Core Courses</span>
                                                                        <span className="text-on-surface-variant">82 Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-primary rounded-full"
                                                                        style={{ width: "64%" }}
                                                                        ></div>
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                                        <span className="text-on-surface">Electives</span>
                                                                        <span className="text-on-surface-variant">24 Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-secondary rounded-full"
                                                                        style={{ width: "18%" }}
                                                                        ></div>
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                                        <span className="text-on-surface">Gen Ed</span>
                                                                        <span className="text-on-surface-variant">22 Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-on-primary-fixed-variant rounded-full"
                                                                        style={{ width: "18%" }}
                                                                        ></div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </aside>`;

const sidebarNew = `<aside className="col-span-12 xl:col-span-4 space-y-6">
                                {/* Curriculum Summary Card */}
                                <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm ring-1 ring-black/[0.03]">
                                        <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">
                                                Curriculum Summary
                                        </h3>
                                        <div className="mb-8">
                                                <span className="text-5xl font-extrabold text-on-surface tracking-tighter">
                                                        {credits.total}
                                                </span>
                                                <span className="text-on-surface-variant font-medium ml-2 uppercase text-xs tracking-widest">
                                                        Total Credits
                                                </span>
                                        </div>
                                        <div className="space-y-4 pt-6 border-t border-surface-container">
                                                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                                                        Credit Distribution
                                                </h4>
                                                <div className="space-y-3">
                                                        <div>
                                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                                        <span className="text-on-surface">Core Courses</span>
                                                                        <span className="text-on-surface-variant">{credits.core} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                                                        style={{ width: \`\${credits.total > 0 ? (credits.core / credits.total) * 100 : 0}%\` }}
                                                                        ></div>
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                                        <span className="text-on-surface">Electives</span>
                                                                        <span className="text-on-surface-variant">{credits.electives} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-secondary rounded-full transition-all duration-500"
                                                                        style={{ width: \`\${credits.total > 0 ? (credits.electives / credits.total) * 100 : 0}%\` }}
                                                                        ></div>
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                                        <span className="text-on-surface">Gen Ed</span>
                                                                        <span className="text-on-surface-variant">{credits.genEd} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-on-primary-fixed-variant rounded-full transition-all duration-500"
                                                                        style={{ width: \`\${credits.total > 0 ? (credits.genEd / credits.total) * 100 : 0}%\` }}
                                                                        ></div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </aside>`;

content = content.replace(sidebarOld, sidebarNew);
fs.writeFileSync(file, content);
