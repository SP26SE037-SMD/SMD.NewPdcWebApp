const fs = require('fs');

const FILE_PATH = 'src/components/hocfdc/CurriculumsManagement.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

const targetStr = `<div
                        className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:shadow-primary/10 hover:border-primary-400 transition-all duration-500 relative z-10 overflow-hidden cursor-pointer"
                        onClick={() =>
                          router.push(
                            \`/dashboard/hocfdc/curriculums/\${curriculum.curriculumId}\`,
                          )
                        }
                      >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />

                        {/* Major Identity */}
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-primary-50 group-hover:border-primary-200 transition-colors">
                          <GraduationCap
                            size={32}
                            className="text-zinc-300 group-hover:text-primary transition-colors"
                          />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center px-2 truncate w-full group-hover:text-primary-700 transition-colors">
                            {curriculum.major?.majorCode || "CORE"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full group-hover:bg-primary-100 group-hover:text-primary-800 transition-colors">
                              {curriculum.curriculumCode}
                            </span>
                            <div
                              className={\`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border \${STATUS_COLORS[curriculum.status] || STATUS_COLORS.DRAFT} group-hover:border-primary-200 transition-colors\`}
                            >
                              {curriculum.status.replace(/_/g, " ")}
                            </div>
                          </div>

                          <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-900 leading-tight tracking-tight group-hover:text-primary-800 transition-colors">
                            {curriculum.curriculumName}
                          </h3>`;

const replacement = `<div
                        className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary-200 transition-all duration-300 relative z-10 overflow-hidden cursor-pointer"
                        onClick={() =>
                          router.push(
                            \`/dashboard/hocfdc/curriculums/\${curriculum.curriculumId}\`,
                          )
                        }
                      >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-transparent rounded-full -mr-32 -mt-32 blur-[60px] opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-zinc-50 to-transparent rounded-full -ml-24 -mb-24 blur-[40px] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" />

                        {/* Major Identity */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.25rem] bg-zinc-50/50 backdrop-blur-md border border-zinc-100/80 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-white group-hover:border-primary-200 group-hover:shadow-[0_8px_16px_-6px_rgba(var(--color-primary-rgb),0.2)] transition-all duration-300">
                          <GraduationCap
                            size={28}
                            strokeWidth={1.5}
                            className="text-zinc-400 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-300"
                          />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center px-2 truncate w-full group-hover:text-primary-700 transition-colors">
                            {curriculum.major?.majorCode || "CORE"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-zinc-100/80 backdrop-blur-sm text-zinc-500 text-[10px] font-black uppercase tracking-wider rounded-md group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                              {curriculum.curriculumCode}
                            </span>
                            <div
                              className={\`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border \${STATUS_COLORS[curriculum.status] || STATUS_COLORS.DRAFT} transition-colors\`}
                            >
                              {curriculum.status.replace(/_/g, " ")}
                            </div>
                          </div>

                          <h3 className="text-xl md:text-2xl font-bold text-zinc-800 leading-snug tracking-tight group-hover:text-primary-900 group-hover:-translate-y-0.5 transition-all duration-300">
                            {curriculum.curriculumName}
                          </h3>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(FILE_PATH, content);
  console.log('Patched');
} else {
  console.log('Target string not found, nothing patched');
}
