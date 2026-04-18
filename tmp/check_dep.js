const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /\}, \[syllabusId, dispatch, syllabusInfo\]\);/,
    "}, [syllabusId, subjectId, dispatch, syllabusInfo]);"
);

// We also need to fix the try/catch fallback to use targetId
data = data.replace(
    /dispatch\(setSyllabusInfo\(\{\s*syllabusId,\s*info: \{\s*bloomTaxonomy: "Level 4 \(Est\.\)",/g,
    `dispatch(setSyllabusInfo({\nsyllabusId: syllabusId || subjectId || 'fallback',\ninfo: {\nbloomTaxonomy: "Level 4 (Est.)",`
);

fs.writeFileSync(file, data);
console.log("Updated dependencies");
