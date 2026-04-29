const XLSX = require('xlsx');

// simulate if they have an issue with sheet_to_json options
let ws = XLSX.utils.aoa_to_sheet([
  ['Session Number', 'Title', 'Duration', 'Category', 'Type'],
  [1, 'Intro', 50, 'Quiz', 'Formative'],
  ['', '', '', 'Exam', 'Summative']
]);
console.log(XLSX.utils.sheet_to_json(ws));
