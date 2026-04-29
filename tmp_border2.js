const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

// Make the list cohesive with divide-y and a single outer border
let newContent = content.replace(
    /className="flex flex-col gap-4 mb-12"/g,
    'className="flex flex-col mb-12 bg-white rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-200"'
);

// Remove the individual card borders, backgrounds, shadows, and big rounded corners
newContent = newContent.replace(
    /className="group px-6 py-5 rounded-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 border border-zinc-200 hover:border-zinc-300 hover:shadow-md"/g,
    'className="group px-6 py-5 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-zinc-50/50"'
);

// Remove the inline style background and shadow so it seamlessly blends into the grouped card container
newContent = newContent.replace(
    /style={{ background: '#ffffff', boxShadow: '0 4px 20px rgba\(0,0,0,0\.02\)' }}/g,
    ''
);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
