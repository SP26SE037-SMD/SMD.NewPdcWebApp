const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /bloomTaxonomy: bloomText,/g,
    "bloomTaxonomy: bloomText || 'Loading...',"
);

fs.writeFileSync(file, data);
console.log("Fixed Bloom Text");
