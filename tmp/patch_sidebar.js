const fs = require('fs');
let content = fs.readFileSync('src/components/layout/dashboard-layout.tsx', 'utf-8');

content = content.replace(/{[\s]*href:\s*"\/dashboard\/vice-principal",[\s]*icon:\s*"dashboard",[\s]*label:\s*"Overview",[\s]*},/, '');

fs.writeFileSync('src/components/layout/dashboard-layout.tsx', content);
