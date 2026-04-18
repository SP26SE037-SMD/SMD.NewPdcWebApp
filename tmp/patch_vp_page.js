const fs = require('fs');
const file = 'src/app/dashboard/vice-principal/page.tsx';
const content = `import { redirect } from 'next/navigation';

export default function VPDashboard() {
  redirect('/dashboard/vice-principal/manage-majors');
}
`;
fs.writeFileSync(file, content);
