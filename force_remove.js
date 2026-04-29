const fs = require('fs');

const path = 'src/components/dashboard/pdcm-content.tsx';
let txt = fs.readFileSync(path, 'utf8');

// The text is probably slightly different. Let's just target the div with text PDCM in the sidebar
let startSidebar = txt.indexOf('<aside className="w-64');
if (startSidebar === -1) startSidebar = txt.indexOf('<aside className="w-72');

if (startSidebar > -1) {
    let pStart = txt.indexOf('<div className="p-8 pb-4">', startSidebar);
    if (pStart > -1) {
        let pEnd = txt.indexOf('<nav', pStart);
        txt = txt.substring(0, pStart) + '\n                <div className="pt-6">\n' + txt.substring(pEnd);
    }
}

fs.writeFileSync(path, txt);
