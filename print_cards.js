const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');
const p1 = content.indexOf('function DevelopCard');
const p2 = content.indexOf('export default function PDCMDashboardContent');
console.log(content.substring(p1, p2));
