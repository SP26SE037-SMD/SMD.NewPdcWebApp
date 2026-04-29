const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

let newContent = content.replace(
    /border border-transparent hover:border-zinc-200/g,
    'border border-zinc-200 hover:border-zinc-300 hover:shadow-md'
);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
