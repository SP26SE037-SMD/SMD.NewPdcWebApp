const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

const regex = /const res = await SyllabusService\.getSyllabusById\(syllabusId\);\s+const data = res\.data;\s+const minBloomLevel = data\?\.minBloomLevel;\s+const bloomText = formatBloomLevel\(minBloomLevel\);\s+const sid = data\?\.subjectId \|\| subjectId;/g;
const replacement = `let minBloomLevel;
                let bloomText;
                let sid = subjectId;
                
                if (syllabusId) {
                    const res = await SyllabusService.getSyllabusById(syllabusId);
                    const data = res.data;
                    minBloomLevel = data?.minBloomLevel;
                    bloomText = formatBloomLevel(minBloomLevel);
                    sid = data?.subjectId || subjectId;
                } else if (subjectData) {
                    minBloomLevel = subjectData?.minBloomLevel;
                    bloomText = formatBloomLevel(minBloomLevel);
                }`;

data = data.replace(regex, replacement);

// We need to add `subjectData` to useEffect dependencies if we use it inside the effect
data = data.replace(
    /\}, \[syllabusId, subjectId, dispatch, syllabusInfo\]\);/,
    "}, [syllabusId, subjectId, dispatch, syllabusInfo, subjectData]);"
);

fs.writeFileSync(file, data);
console.log("Fixed fetch logic");
