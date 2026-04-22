const fs = require('fs');

const FILE_PATH = 'src/components/hocfdc/CurriculumsManagement.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Update to an even better layout with improved typography and details
const regex = /<div\s+className="bg-white rounded-\[2\.5rem\] border border-zinc-100 p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 shadow-\[0_10px_40px_rgba\(0,0,0,0\.02\)\] hover:shadow-2xl hover:shadow-primary\/10 hover:border-primary-400 transition-all duration-500 relative z-10 overflow-hidden cursor-pointer"[\s\S]*?\{\/\* Major Identity \*\/\}[\s\S]*?<div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-primary-50 group-hover:border-primary-200 transition-colors">[\s\S]*?<GraduationCap[\s\S]*?\/>[\s\S]*?<span[\s\S]*?>[\s\S]*?\{curriculum\.major\?\.majorCode \|\| "CORE"\}[\s\S]*?<\/span>\s*<\/div>\s*<div className="flex-1 min-w-0 space-y-4">\s*<div className="flex flex-wrap items-center gap-3">\s*<span className="px-4 py-1\.5 bg-zinc-100 text-zinc-500 text-\[10px\] font-black uppercase tracking-widest rounded-full group-hover:bg-primary-100 group-hover:text-primary-800 transition-colors">\s*\{curriculum\.curriculumCode\}\s*<\/span>\s*<div\s*className=\{\`px-4 py-1\.5 rounded-full text-\[10px\] font-black uppercase tracking-widest border \$\{STATUS_COLORS\[curriculum\.status\] \|\| STATUS_COLORS\.DRAFT\} group-hover:border-primary-200 transition-colors\`\}\s*>\s*\{curriculum\.status\.replace\(\/_/g, " "\)\}\s*<\/div>\s*<\/div>\s*<h3 className="text-2xl md:text-3xl font-extrabold text-zinc-900 leading-tight tracking-tight group-hover:text-primary-800 transition-colors">\s*\{curriculum\.curriculumName\}\s*<\/h3>/;

const replacement = `<div
                        className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary-200 transition-all duration-300 relative z-10 overflow-hidden cursor-pointer"
                        onClick={() =>
                          router.push(
                            \`/dashboard/hocfdc/curriculums/\${curriculum.curriculumId}\`,
                          )
                        }
                      >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50/50 to-transparent rounded-full -mr-32 -mt-32 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Major Identity */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all duration-300">
                          <GraduationCap
                            size={28}
                            strokeWidth={1.5}
                            className="text-zinc-400 group-hover:text-primary transition-colors"
                          />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center px-2 truncate w-full group-hover:text-primary-700 transition-colors">
                            {curriculum.major?.majorCode || "CORE"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-lg group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                              {curriculum.curriculumCode}
                            </span>
                            <div
                              className={\`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border \${STATUS_COLORS[curriculum.status] || STATUS_COLORS.DRAFT} transition-colors\`}
                            >
                              {curriculum.status.replace(/_/g, " ")}
                            </div>
                          </div>

                          <h3 className="text-xl md:text-2xl font-bold text-zinc-800 leading-snug tracking-tight group-hover:text-primary-900 transition-colors">
                            {curriculum.curriculumName}
                          </h3>`;

content = content.replace(regex, replacement);
fs.writeFileSync(FILE_PATH, content);
console.log('Patched');
