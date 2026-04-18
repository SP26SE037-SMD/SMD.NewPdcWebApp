const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/semester-structure.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
        /<span className="text-5xl font-extrabold text-on-surface tracking-tighter">\s*128\s*<\/span>\s*<span className="text-on-surface-variant font-medium ml-2 uppercase text-xs tracking-widest">\s*Total Credits\s*<\/span>/m,
        `<span className="text-5xl font-extrabold text-on-surface tracking-tighter">
                                                        {credits.total}
                                                </span>
                                                <span className="text-on-surface-variant font-medium ml-2 uppercase text-xs tracking-widest">
                                                        Total Credits
                                                </span>`
);

content = content.replace(
        /<span className="text-on-surface-variant">82 Credits<\/span>\s*<\/div>\s*<div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">\s*<div\s*className="h-full bg-primary rounded-full"\s*style={{ width: "64%" }}\s*><\/div>\s*<\/div>\s*<\/div>/m,
        `<span className="text-on-surface-variant">{credits.core} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                                                        style={{ width: \`\${credits.total > 0 ? (credits.core / credits.total) * 100 : 0}%\` }}
                                                                        ></div>
                                                                </div>
                                                        </div>`
);

content = content.replace(
        /<span className="text-on-surface-variant">24 Credits<\/span>\s*<\/div>\s*<div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">\s*<div\s*className="h-full bg-secondary rounded-full"\s*style={{ width: "18%" }}\s*><\/div>\s*<\/div>\s*<\/div>/m,
        `<span className="text-on-surface-variant">{credits.electives} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-secondary rounded-full transition-all duration-500"
                                                                        style={{ width: \`\${credits.total > 0 ? (credits.electives / credits.total) * 100 : 0}%\` }}
                                                                        ></div>
                                                                </div>
                                                        </div>`
);

content = content.replace(
        /<span className="text-on-surface-variant">22 Credits<\/span>\s*<\/div>\s*<div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">\s*<div\s*className="h-full bg-on-primary-fixed-variant rounded-full"\s*style={{ width: "18%" }}\s*><\/div>\s*<\/div>\s*<\/div>/m,
        `<span className="text-on-surface-variant">{credits.genEd} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-on-primary-fixed-variant rounded-full transition-all duration-500"
                                                                        style={{ width: \`\${credits.total > 0 ? (credits.genEd / credits.total) * 100 : 0}%\` }}
                                                                        ></div>
                                                                </div>
                                                        </div>`
);

fs.writeFileSync(file, content);
