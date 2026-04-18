const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /syllabusData\.credit/g,
    "syllabusData?.credit"
);

data = data.replace(
    /syllabusData\.noCredit/g,
    "syllabusData?.noCredit"
);

data = data.replace(
    /syllabusData\.scoringScale/g,
    "syllabusData?.scoringScale"
);

data = data.replace(
    /syllabusData\.minAvgMarkToPass/g,
    "syllabusData?.minAvgMarkToPass"
);

data = data.replace(
    /syllabusData\.decisionNo/g,
    "syllabusData?.decisionNo"
);

fs.writeFileSync(file, data);
console.log("Fixed optional chaining");
