import { Major } from "./major.service";
import { CurriculumFramework } from "./curriculum.service";

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(14, 30, 0, 0);

const today = new Date();
today.setHours(9, 15, 0, 0);

export const MOCK_MAJORS: Major[] = [
    {
        majorId: "major-se-001",
        majorCode: "SE",
        majorName: "Software Engineering",
        description: "Core software development and architecture.",
        status: "INTERNAL_REVIEW",
        createdAt: yesterday.toISOString(),
        pos: [
            { poId: "po-1", poName: "PO1", description: "Design complex systems" },
            { poId: "po-2", poName: "PO2", description: "Implement secure code" }
        ]
    },
    {
        majorId: "major-ai-002",
        majorCode: "AI",
        majorName: "Artificial Intelligence",
        description: "Machine learning and cognitive computing.",
        status: "PUBLISHED",
        createdAt: today.toISOString()
    },
    {
        majorId: "major-gd-003",
        majorCode: "GD",
        majorName: "Graphic Design",
        description: "Visual communication and digital arts.",
        status: "INTERNAL_REVIEW",
        createdAt: today.toISOString()
    },
    {
        majorId: "major-db-004",
        majorCode: "DB",
        majorName: "Digital Business",
        description: "E-commerce and digital transformation.",
        status: "DRAFT",
        createdAt: yesterday.toISOString()
    }
];

export const MOCK_CURRICULUMS: CurriculumFramework[] = [
    {
        curriculumId: "curr-se-2024",
        curriculumCode: "K19-SWE-2024",
        majorName: "Software Engineering",
        description: "In-depth SWE curriculum for 2024.",
        majorCode: "SE",
        frameworkName: "SE Curriculum Framework 2024",
        version: "v1.2",
        status: "INTERNAL_REVIEW_WITH_ENACTMENT",
        updatedAt: today.toISOString(),
        createdAt: yesterday.toISOString(),
        plos: [],
        subjects: [
            { subjectId: "sub-1", subjectCode: "PRN231", subjectName: "Cross-platform Development", credits: 3, semester: 5, syllabusStatus: "PUBLISHED", description: "Mobile development with .NET" },
            { subjectId: "sub-2", subjectCode: "SWP391", subjectName: "Software Development Project", credits: 3, semester: 6, syllabusStatus: "PUBLISHED", description: "Capstone graduation project" },
            { subjectId: "sub-3", subjectCode: "EXE101", subjectName: "Experiential Entrepreneurship 1", credits: 2, semester: 4, syllabusStatus: "PENDING_REVIEW", description: "Venture creation 1" },
            { subjectId: "sub-4", subjectCode: "MLN131", subjectName: "Marxism-Leninism Philosophy", credits: 3, semester: 1, syllabusStatus: "PUBLISHED", description: "General studies" },
            { subjectId: "sub-5", subjectCode: "MAE101", subjectName: "Mathematics for Engineering", credits: 3, semester: 1, syllabusStatus: "DRAFT", description: "Calculus for engineers" }
        ]
    },
    {
        curriculumId: "curr-ai-2024",
        curriculumCode: "K19-AI-2024",
        majorName: "Artificial Intelligence",
        description: "Advanced AI track.",
        majorCode: "AI",
        frameworkName: "AI Advanced Track 2024",
        version: "v1.0",
        status: "INTERNAL_REVIEW_WITHOUT_ENACTMENT",
        updatedAt: today.toISOString(),
        createdAt: today.toISOString(),
        plos: [],
        subjects: [
            { subjectId: "sub-ai-1", subjectCode: "PRN211", subjectName: "Basic Programming", credits: 3, semester: 1, syllabusStatus: "PUBLISHED", description: "Intro to C#" },
            { subjectId: "sub-ai-2", subjectCode: "AIG201", subjectName: "Intro to AI", credits: 3, semester: 2, syllabusStatus: "DRAFT", description: "Logic and AI" }
        ]
    }
];
