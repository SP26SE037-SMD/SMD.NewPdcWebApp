const fs = require('fs');

const files = [
    'src/app/dashboard/pdcm/materials/new/page.tsx',
    'src/app/dashboard/pdcm/materials/[materialId]/edit/page.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');

    // Replace the 'p' logic in parseHtmlToBlocks
    const regex = /else if \(tag === 'p'\) \{[\s\S]*?else \{\s*type = 'PARAGRAPH';\s*\}\s*\}/;
    
    const newLogic = `else if (tag === 'p') {
                let text = el.innerText.trim();
                if (!text) text = Object.assign(document.createElement('div'), {innerHTML: el.innerHTML}).innerText.trim();
                
                if (text.length > 0 && text.length < 150) {
                    const innerHtml = el.innerHTML.trim();
                    const isFullyBold = (innerHtml.startsWith('<strong>') && innerHtml.endsWith('</strong>') && innerHtml.replace('<strong>', '').replace('</strong>', '').trim() === text) ||
                        (innerHtml.startsWith('<b>') && innerHtml.endsWith('</b>') && innerHtml.replace('<b>', '').replace('</b>', '').trim() === text);
                    
                    const isChapter = /^Chapter\\s+\\d+/i.test(text);
                    const isHeadingLike = /^([0-9]+[.)]|[A-Z]\\.|[IVX]+\\.)\\s+[A-ZÀ-Ỹ]/.test(text) && !text.endsWith('.');

                    if (isChapter) {
                        type = 'H1';
                    } else if (isFullyBold || isHeadingLike) {
                        type = 'H2';
                    } else {
                        type = 'PARAGRAPH';
                    }
                } else {
                    type = 'PARAGRAPH';
                }
            }`;

    content = content.replace(regex, newLogic);
    fs.writeFileSync(file, content, 'utf-8');
    console.log("Updated heuristics in", file);
});
