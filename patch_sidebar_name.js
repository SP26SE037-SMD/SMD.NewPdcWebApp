const fs = require('fs');

const path = 'src/components/dashboard/pdcm-content.tsx';
let txt = fs.readFileSync(path, 'utf8');

const sidebarHeaderStr = `                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ background: C.primary }}>
                            P
                        </div>
                        <div>
                            <h1 className="font-black tracking-tight text-lg leading-none" style={{ color: C.onSurface }}>PDCM</h1>
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">Workspace v2.0</p>
                        </div>
                    </div>`;

if (txt.includes(sidebarHeaderStr)) {
    txt = txt.replace(sidebarHeaderStr, "");
}

fs.writeFileSync(path, txt);
console.log("Patched sidebar name successfully.");
