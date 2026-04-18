const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/manage-majors-content.tsx';
let data = fs.readFileSync(file, 'utf8');

const match = data.match(/<div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">[\s\S]*?<\/div>\s*<div className="px-8 pb-10 flex flex-col sm:flex-row-reverse gap-3">/);
if (match) {
    console.log("MATCH FOUND:");
    console.log(match[0]);
} else {
    console.log("NO MATCH");
}
