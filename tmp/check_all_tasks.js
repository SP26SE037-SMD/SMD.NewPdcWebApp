const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = [
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/materials/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/submit/page.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let data = fs.readFileSync(file, 'utf8');
        data = data.replace(
            /const syllabusId = routeTaskData\?\.data\?\.syllabus\?\.syllabusId;/g,
            "const syllabusId = routeTaskData?.data?.syllabus?.syllabusId || routeTaskData?.data?.syllabusId;"
        );
        data = data.replace(
            /const syllabusId = realTask\?\.syllabus\?\.syllabusId;/g,
            "const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;"
        );
        fs.writeFileSync(file, data);
        console.log("Updated", file);
    }
}
