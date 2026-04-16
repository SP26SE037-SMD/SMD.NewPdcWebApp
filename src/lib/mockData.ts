export interface Material {
    name: string;
    info: string;
}

export interface Chapter {
    id: string;
    title: string;
}

export interface AssignedTask {
    id: string;
    title: string;
    type: string;
    deadline: string;
    priority: "High" | "Medium" | "Low";
    status: "My Task" | "Submitted";
    description: string;
    assigner: string;
    syllabusInfo?: {
        sourcesReference: string[];
        bloomTaxonomy: string;
        clos: string[];
        chapters: Chapter[];
    };
}

export const MOCK_TASKS: AssignedTask[] = [
    { 
        id: "T-101", 
        title: "Design Material: SWE201 - Software Engineering", 
        type: "Material Design", 
        deadline: "Today, 5:00 PM", 
        priority: "High",
        status: "My Task",
        description: "You have been assigned to design course materials for Software Engineering. Please review the syllabus references, Bloom's level, and CLOs to create appropriate materials for each chapter.",
        assigner: "Dr. Nguyen Van A (HoPDC)",
        syllabusInfo: {
            sourcesReference: ["Sommerville, I. (2015). Software Engineering (10th ed.). Pearson.", "Clean Code by Robert C. Martin"],
            bloomTaxonomy: "Level 4: Analyzing & Level 5: Evaluating",
            clos: [
                "CLO1: Analyze complex software requirements.",
                "CLO2: Evaluate architectural design patterns for scalability.",
                "CLO3: Apply agile methodologies in a group project setting."
            ],
            chapters: [
                { id: "C1", title: "Chapter 1: Introduction to Agile Practices" },
                { id: "C2", title: "Chapter 2: Requirements Engineering" },
                { id: "C3", title: "Chapter 3: System Modeling & Architecture" }
            ]
        }
    },
    { 
        id: "T-102", 
        title: "Update Content: PRN211 - C# Programming", 
        type: "Material Update", 
        deadline: "Tomorrow, 12:00 PM", 
        priority: "Medium",
        status: "My Task",
        description: "Review and update the practical material for PRN211 to include .NET 8 features.",
        assigner: "System Auto-Assignment",
        syllabusInfo: {
            sourcesReference: ["Pro C# 10 with .NET 6 (Apress)", "Microsoft Learning Path for .NET"],
            bloomTaxonomy: "Level 3: Applying",
            clos: ["CLO1: Construct basic C# applications.", "CLO2: Utilize Entity Framework Core for Data Access."],
            chapters: [
                { id: "C1", title: "Chapter 1: .NET Architecture Overview" },
                { id: "C2", title: "Chapter 2: LINQ and Collections" }
            ]
        }
    },
    { 
        id: "T-098", 
        title: "Review Syllabus: DBI202 - Database Systems", 
        type: "Curriculum Review",
        deadline: "Nov 02, 2026", 
        priority: "High",
        status: "Submitted",
        description: "Verify the database normalization chapters and the new NoSQL introduction section in the syllabus.",
        assigner: "Auto-Assignment"
    }
];
