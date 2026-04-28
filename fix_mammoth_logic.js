const fs = require('fs');

const files = [
    'src/app/dashboard/pdcm/materials/new/page.tsx',
    'src/app/dashboard/pdcm/materials/[materialId]/edit/page.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');

    // 1. Fix mammoth style map
    content = content.replace(/const mammothOptions = {[\s\S]*?};/, `const mammothOptions = {
                styleMap: [
                    "p[style-name='Title'] => h1:fresh",
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Tiêu đề 1'] => h1:fresh",
                    "p[style-name='Subtitle'] => h2:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Tiêu đề 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h2:fresh",
                    "p[style-name='Tiêu đề 3'] => h2:fresh",
                    "p[style-name='Heading 4'] => h2:fresh",
                    "p[style-name='Tiêu đề 4'] => h2:fresh",
                    "p[style-name='Heading 5'] => h2:fresh",
                    "p[style-name='Heading 6'] => h2:fresh",
                    "p[style-name='Center'] => p.center",
                    "p[style-name='Centered'] => p.center",
                    "p[style-name='Right'] => p.right"
                ]
            };`);

    // 2. Fix parseHtmlToBlocks
    // Look for: else if (tag === 'p') type = 'PARAGRAPH';
    content = content.replace(/else if \(tag === 'p'\) type = 'PARAGRAPH';/, `else if (tag === 'p') {
                const text = el.innerText.trim();
                if (text.length > 0 && text.length < 150) {
                    const innerHtml = el.innerHTML.trim();
                    // Check if the entire paragraph is just a bold string
                    if ((innerHtml.startsWith('<strong>') && innerHtml.endsWith('</strong>') && innerHtml.replace('<strong>', '').replace('</strong>', '').trim() === text) ||
                        (innerHtml.startsWith('<b>') && innerHtml.endsWith('</b>') && innerHtml.replace('<b>', '').replace('</b>', '').trim() === text)) {
                        type = 'H2';
                    } else {
                        type = 'PARAGRAPH';
                    }
                } else {
                    type = 'PARAGRAPH';
                }
            }`);

    fs.writeFileSync(file, content, 'utf-8');
    console.log("Updated", file);
});
