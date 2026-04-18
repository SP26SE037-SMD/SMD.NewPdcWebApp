const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// We need to change `if (!syllabusId) return;` to `if (!syllabusId && !subjectId) return;`
data = data.replace(
    /if \(\!syllabusId\) return;/g,
    "if (!syllabusId && !subjectId) return;"
);

data = data.replace(
    /const sid = data\?\.subjectId;/g,
    "const sid = data?.subjectId || subjectId;"
);

data = data.replace(
    /if \(\!sid\) return;/g,
    "if (!sid) return;"
);

// Fallback for redux id
data = data.replace(
    /dispatch\(setSyllabusInfo\(\{[\s\S]*?syllabusId,[\s\S]*?info: \{/g,
    "const targetId = syllabusId || subjectId || 'placeholder';\ndispatch(setSyllabusInfo({\nsyllabusId: targetId,\ninfo: {"
);

data = data.replace(
    /const syllabusInfo = syllabusId \? syllabusInfoDB\[syllabusId\] : undefined;/g,
    "const syllabusInfo = (syllabusId || subjectId) ? syllabusInfoDB[syllabusId || subjectId] : undefined;"
);

fs.writeFileSync(file, data);
console.log("Updated useEffect");
