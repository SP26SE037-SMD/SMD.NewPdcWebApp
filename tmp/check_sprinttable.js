const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/hocfdc/SprintTasksTable.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /task\.syllabus\.syllabusName/g,
  "task.syllabus?.syllabusName"
);

data = data.replace(
    /task\.syllabus\.status/g,
    "task.syllabus?.status"
);

fs.writeFileSync(file, data);
