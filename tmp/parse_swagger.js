const fs = require('fs');

const data = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));

// Find GET /subjects
let path = Object.keys(data.paths).find(p => p.endsWith('/subjects'));
if (!path) {
  console.log("No subjects path Found in " + Object.keys(data.paths).length + " paths");
  process.exit(1);
}
console.log("Found path:", path);
const api = data.paths[path]?.get;

// Check responses 200
const ref = api.responses['200']?.content?.['*/*']?.schema?.['$ref'];
let schemaName = ref ? ref.split('/').pop() : null;
console.log("Response Schema:", schemaName);

if (schemaName) {
  const schema = data.components.schemas[schemaName];
  // usually it's an ApiResponse wrapper containing 'data'
  const dataProp = schema.properties?.data;
  
  // if it's generic like PageableResponse, it might be nested
  console.log("Wrapper Data:", JSON.stringify(dataProp, null, 2));
}

// Check SubjectResponse specifically:
const itemDto = data.components.schemas['SubjectResponse'] || data.components.schemas['SubjectDto'];
if (itemDto) {
    console.log("Subject Properties:", Object.keys(itemDto.properties));
    console.log("preRequisite:", itemDto.properties.preRequisite || itemDto.properties.prerequisites || itemDto.properties.preRequisites || "NOT INCLUDED");
} else {
    // List all schema keys that contain "Subject"
    console.log("Schemas:", Object.keys(data.components.schemas).filter(s => s.toLowerCase().includes('subject')));
}
