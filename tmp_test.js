const XLSX = require('xlsx');

const ws = XLSX.utils.json_to_sheet([
    { 'Category': 'Formative', 'Type': 'Quiz', 'Part': 1, 'Weight': 10, 'Completion Criteria': 'Pass 50%', 'Duration': 15, 'Question Type': 'Multiple Choice', 'Knowledge Skill': 'Remembering', 'Grading Guide': '1 point/question', 'Note': 'Optional', 'CLOs': 'CLO1, CLO2' },
    { 'Category': 'Summative', 'Type': 'Final', 'Part': 1, 'Weight': 40, 'Completion Criteria': '', 'Duration': 90, 'Question Type': 'Essay', 'Knowledge Skill': 'Applying', 'Grading Guide': 'Rubric A', 'Note': 'Mandatory', 'CLOs': 'CLO3' }
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Template");

const ws2 = wb.Sheets["Template"];
const rows = XLSX.utils.sheet_to_json(ws2);
console.log("length:", rows.length);
