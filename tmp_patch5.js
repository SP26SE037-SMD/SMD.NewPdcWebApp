const fs = require('fs');

const FILE_PATH = 'src/components/hocfdc/CurriculumsManagement.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Modify Header
content = content.replace(
  'h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight"',
  'h1 className="text-4xl font-extrabold text-zinc-800 tracking-tight drop-shadow-sm"'
);

// Modify Tab Styles
content = content.replace(
  /button\s+key=\{tab\.label\}[\s\S]*?className=\{\`relative px-6 py-5 text-\[11px\] font-bold uppercase tracking-widest transition-all whitespace-nowrap \$\{/,
  `button
                    key={tab.label}
                    onClick={() => handleTabChange(tab.value)}
                    className={\`relative px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap \${`
);

// Modify Individual Card Container
content = content.replace(
  'className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:shadow-primary/10 hover:border-primary-400 transition-all duration-500 relative z-10 overflow-hidden cursor-pointer"',
  'className="bg-white/60 backdrop-blur-3xl rounded-[2rem] border border-zinc-100 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 shadow-sm hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(var(--color-primary-rgb),0.15)] hover:border-primary-200 transition-all duration-500 relative z-10 overflow-hidden cursor-pointer"'
);

// Add inner glows to cards
content = content.replace(
  '<div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />',
  '<div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700" />\\n                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-zinc-100 to-transparent rounded-full -ml-24 -mb-24 blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-700 delay-100" />'
);

// Enhance Major Icon Block
content = content.replace(
  '<div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-primary-50 group-hover:border-primary-200 transition-colors">',
  '<div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.25rem] bg-zinc-50/80 backdrop-blur-sm border border-zinc-100 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-white group-hover:border-primary-200 group-hover:shadow-lg transition-all duration-300">'
);
content = content.replace(
  '<GraduationCap\\n                            size={32}',
  '<GraduationCap\\n                            size={28}\\n                            strokeWidth={1.5}'
);

// Enhance Info texts
content = content.replace(
  '<h3 className="text-2xl md:text-3xl font-extrabold text-zinc-900 leading-tight tracking-tight group-hover:text-primary-800 transition-colors">',
  '<h3 className="text-xl md:text-2xl font-bold text-zinc-800 leading-snug tracking-tight group-hover:text-primary-900 transition-all duration-300">'
);
// Shrink buttons slightly
content = content.replace(
  'className="flex-1 lg:flex-none btn-charcoal px-8 group/btn"',
  'className="flex-1 lg:flex-none btn-charcoal px-6 py-3 group/btn text-[10px] uppercase font-black tracking-wider"'
);
content = content.replace(
  'className="flex-1 lg:flex-none btn-charcoal px-8 group/btn"',
  'className="flex-1 lg:flex-none btn-charcoal px-6 py-3 group/btn text-[10px] uppercase font-black tracking-wider"'
);

// Write to file
fs.writeFileSync(FILE_PATH, content);
console.log('Successfully generated new UI style');
