const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookAPI = `
const fetchSemesterStructure = async (curriculumId?: string) => {
        if (!curriculumId) return null;
        const res = await fetch(
                \`/api/curriculum-group-subjects/semester-mappings?curriculumId=\${curriculumId}\`,
        );
        if (!res.ok) throw new Error("Failed to fetch semester structure");
        return res.json();
};

const calculateOverviewCredits = (mappings: any[]) => {
    let total = 0;
    mappings.forEach((mapping) => {
        mapping.subjects?.forEach((subject: any) => {
            const credit = Number(subject.credit) || Number(subject.credits) || 0;
            total += credit;
        });
    });
    return total;
};
`;

if (!content.includes('fetchSemesterStructure')) {
    content = content.replace('export default function MajorReviewPage({', hookAPI + '\nexport default function MajorReviewPage({');
}

const reqLoadingReplace = `const curriculum = requestData?.curriculum;
        const curId = curriculum?.curriculumId;
        
        const { data: resData } = useQuery({
                queryKey: ["semester-mappings", curId],
                queryFn: () => fetchSemesterStructure(curId),
                enabled: !!curId,
        });
        const calculatedTotalCredits = calculateOverviewCredits(resData?.data?.semesterMappings || []);`;

if (!content.includes('calculatedTotalCredits')) {
    content = content.replace('const curriculum = requestData?.curriculum;', reqLoadingReplace);
}

content = content.replace(
    /Total Credits\s*<\/span>\s*<span className="text-primary font-mono font-bold">\s*120 Units\s*<\/span>/g,
    `Total Credits
                                                                        </span>
                                                                        <span className="text-primary font-mono font-bold">
                                                                        {calculatedTotalCredits > 0 ? \`\${calculatedTotalCredits} Units\` : "N/A"}
                                                                        </span>`
);

content = content.replace(
    /"\s*\{major\?\.description \|\|[\s\S]*?"The Bachelor of Science in Computer Science provides a rigorous foundation in computational theory and practical software engineering. Our 2024 curriculum focuses on sustainable AI, high-performance computing, and cross-platform architecture, preparing students for the intellectual challenges of the next decade's digital economy."\}\s*"/g,
    `"{major?.description || "This curriculum focuses on providing a rigorous foundation and practical engineering skills, preparing students for the intellectual challenges of the next decade's digital economy."}"`
);

fs.writeFileSync(file, content);
