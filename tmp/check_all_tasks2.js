const fs = require('fs');

const files = [
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/materials/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/submit/page.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/layout.tsx',
    '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let data = fs.readFileSync(file, 'utf8');
        data = data.replace(
            /(const syllabusId = routeTaskData\?\.data\?\.syllabus\?\.syllabusId)(?! \|\|)/g,
            "$1 || routeTaskData?.data?.syllabusId"
        );
        data = data.replace(
            /(const syllabusId = realTask\?\.syllabus\?\.syllabusId)(?! \|\|)/g,
            "$1 || realTask?.syllabusId"
        );
        fs.writeFileSync(file, data);
        console.log("Updated", file);
    }
}
