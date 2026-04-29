const fs = require('fs');

const path = 'src/components/dashboard/pdcm-content.tsx';
let txt = fs.readFileSync(path, 'utf8');

// Colors back to white
txt = txt.replace("surface: '#f6fbf5',", "surface: '#ffffff',");
txt = txt.replace("surfaceContainerLow: '#eff7ee',", "surfaceContainerLow: '#ffffff',");

// Title text
txt = txt.replace("navTab === 'develop' ? 'Development Pipeline' : 'Peer Review Queue'", "navTab === 'develop' ? 'Develop syllabus task' : 'Review task management'");

// Nav item filtering
const navStart = txt.indexOf('<nav className="space-y-1">');
const navEnd = txt.indexOf('</nav>', navStart) + 6;
const newNav = `<nav className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40 px-4">Menu</p>
                        <NavItem icon="dashboard" label="My Tasks" active />
                    </nav>`;
txt = txt.substring(0, navStart) + newNav + txt.substring(navEnd);

// Sidebar user info removing
const footerStart = txt.indexOf('<div className="mt-auto p-6">');
if (footerStart > -1) {
    const footerEnd = txt.indexOf('</div>', txt.indexOf('</div>', txt.indexOf('</div>', footerStart) + 6) + 6) + 6;
    // We'll just remove the whole mt-auto p-6 div block.
    // Looking at the block carefully:
    /*
                <div className="mt-auto p-6">
                    <div className="p-4 rounded-2xl space-y-3"...>
                        <div className="flex items-center gap-3">
                            <div className="...">...</div>
                            <div className="...">...</div>
                        </div>
                    </div>
                </div>
    */
    const actualFooterStr = `                <div className="mt-auto p-6">
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: C.surfaceContainerLowest, border: \`1px solid \${C.outline}15\` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold truncate" style={{ color: C.onSurface }}>{user?.fullName || 'User Name'}</p>
                                <p className="text-[10px] opacity-60 truncate" style={{ color: C.onSurfaceVariant }}>{user?.email || 'email@edu.vn'}</p>
                            </div>
                        </div>
                    </div>
                </div>`;
    txt = txt.replace(actualFooterStr, '');
}

// Wrapping layout with Header
// Add Header import if not exists
if (!txt.includes("import { Header } from '@/components/layout/Header';")) {
    const tsxStart = txt.indexOf("import { SyllabusService }");
    txt = txt.substring(0, tsxStart) + "import { Header } from '@/components/layout/Header';\nimport { SyllabusService }" + txt.substring(tsxStart + 26);
}

// Swap out <div className="flex h-screen overflow-hidden text-sm"
let layoutStartStr = '        <div className="flex h-screen overflow-hidden';
let layoutStartIdx = txt.indexOf(layoutStartStr);

if (layoutStartIdx > -1) {
    let oldLayoutMatched = txt.substring(layoutStartIdx, txt.indexOf('>', layoutStartIdx) + 1);
    
    // We add the wrapper flex-col + the Header, then `<div className="flex flex-1 ..."` 
    let newLayout = `        <div className="flex flex-col h-screen overflow-hidden text-sm bg-white" style={{ color: C.onSurface }}>
            <Header />
            <div className="flex flex-1 pt-16 mt-4">`;

    txt = txt.replace(oldLayoutMatched, newLayout);
    
    // We also need to remove the inline `<header ... bg-white ... outline... >` which used to contain the search logic 
    // Wait, the header we are removing is:
    /*
                <header className="h-20 px-8 flex items-center justify-between border-b shrink-0 bg-white" style={{ borderColor: C.outline + '10' }}>
                    <div className="flex items-center gap-2">...
                </header>
    */
    const innerHeaderStart = txt.indexOf('<header className="h-20');
    if (innerHeaderStart > -1) {
        const innerHeaderEnd = txt.indexOf('</header>', innerHeaderStart) + 9;
        txt = txt.substring(0, innerHeaderStart) + txt.substring(innerHeaderEnd);
    }
    
    // add closing `</div>` to the very bottom
    const closingDivIdx = txt.lastIndexOf('</div>');
    txt = txt.substring(0, closingDivIdx) + '            </div>\n' + txt.substring(closingDivIdx);
}

fs.writeFileSync(path, txt);
console.log("Patched layout structure safely.");
