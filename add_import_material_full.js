const fs = require('fs');

const materialsPagePath = 'src/app/dashboard/pdcm/tasks/[taskId]/materials/page.tsx';
let content = fs.readFileSync(materialsPagePath, 'utf8');

if (!content.includes('import mammoth from "mammoth";')) {
    content = content.replace(/(import .* from 'lucide-react';)/, "$1\nimport mammoth from \"mammoth\";\nimport { BlockService } from \"@/services/block.service\";");
}

const theHelperCode = `
    const sanitizeBlockContent = (html: string) => {
        if (!html) return '';
        let cleaned = html.replace(/&nbsp;/g, ' ');
        cleaned = cleaned.replace(/<p[^>]*>/i, '');
        cleaned = cleaned.replace(/<\\/p>/i, '');
        return cleaned.trim();
    };

    const parseHtmlToBlocks = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;
        const resultBlocks: any[] = [];

        const processNode = (node: Node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();

            let type = 'PARAGRAPH';
            let align = 'left';
            const contentHTML = el.innerHTML;

            if (el.style.textAlign) {
                align = el.style.textAlign;
            } else if (el.classList.contains('center')) {
                align = 'center';
            } else if (el.classList.contains('right')) {
                align = 'right';
            }

            if (tag === 'h1') type = 'H1';
            else if (tag === 'h2') type = 'H2';
            else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') type = 'H2';
            else if (tag === 'p') {
                const text = el.innerText.trim();
                // Heuristic: If paragraph is short and entirely bolded, treat it as H2
                if (text.length > 0 && text.length < 150) {
                    const innerHtml = el.innerHTML.trim();
                    if ((innerHtml.startsWith('<strong>') && innerHtml.endsWith('</strong>') && innerHtml.replace('<strong>', '').replace('</strong>', '').trim() === text) ||
                        (innerHtml.startsWith('<b>') && innerHtml.endsWith('</b>') && innerHtml.replace('<b>', '').replace('</b>', '').trim() === text)) {
                        type = 'H2';
                    } else {
                        type = 'PARAGRAPH';
                    }
                } else {
                    type = 'PARAGRAPH';
                }
            } else if (tag === 'ul' || tag === 'ol') {
                const listType = tag === 'ul' ? 'BULLET_LIST' : 'ORDERED_LIST';
                const items = el.querySelectorAll('li');
                items.forEach(li => {
                    resultBlocks.push({
                        type: listType,
                        content: sanitizeBlockContent(li.innerHTML),
                        align: align
                    });
                });
                return;
            } else if (tag === 'blockquote') type = 'QUOTE';
            else if (tag === 'hr') type = 'DIVIDER';
            else if (tag === 'table') {
                const rows: string[][] = [];
                const trElements = el.querySelectorAll('tr');
                trElements.forEach(tr => {
                    const cells: string[] = [];
                    const tdElements = tr.querySelectorAll('td, th');
                    tdElements.forEach(td => {
                        cells.push(td.innerHTML.trim());
                    });
                    if (cells.length > 0) rows.push(cells);
                });

                if (rows.length > 0) {
                    resultBlocks.push({
                        type: 'TABLE',
                        content: JSON.stringify({ rows }),
                        align: 'left'
                    });
                }
                return;
            } else if (tag === 'li') {
                type = 'BULLET_LIST';
            } else {
                if (el.innerText.trim()) {
                    type = 'PARAGRAPH';
                } else {
                    return;
                }
            }

            resultBlocks.push({
                type,
                content: sanitizeBlockContent(contentHTML),
                align: align
            });
        };

        Array.from(body.childNodes).forEach(processNode);
        return resultBlocks;
    };
`;

if (!content.includes('parseHtmlToBlocks')) {
    // Insert just above "return ("
    content = content.replace(/(\s+return \([\s\S]*?<div className="space-y-0 relative">)/, theHelperCode + "$1");
}

const onImportOld = `onImport={async (file) => {
                    console.log("Importing material file:", file);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    // TODO: call API to import file
                }}`;

const onImportNew = `onImport={async (file) => {
                    try {
                        const filename = file.name.replace(/\\.[^/.]+$/, "").replace(/[_-]/g, " ");
                        
                        // Parse word doc locally using improved heuristics
                        const arrayBuffer = await file.arrayBuffer();
                        const mammothOptions = {
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
                        };
                        const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
                        const importedBlocks = parseHtmlToBlocks(result.value);

                        // Save straight to API
                        // 1. Create a quick Material wrapper
                        let nextId = 0;
                        try {
                            const existingMaterialsRes = await MaterialService.getMaterialsBySyllabusId(syllabusId as string);
                            const mats = Array.isArray(existingMaterialsRes?.data) ? existingMaterialsRes.data : [];
                            const ids = mats.map((m: any) => m.id).filter((id: any) => id !== undefined && !isNaN(Number(id)));
                            if (ids.length > 0) {
                                nextId = Math.max(...ids.map((id: any) => Number(id))) + 1;
                            }
                        } catch (err) {}
                        
                        const matRes = await MaterialService.createMaterial({
                            title: filename,
                            materialType: "DOCUMENT",
                            id: nextId,
                            syllabusId: syllabusId as string
                        });
                        
                        const theNewId = matRes?.data?.materialId || matRes?.data?.id;

                        // 2. Map valid blocks and Push
                        const validBlocks = importedBlocks.filter(b => {
                            if (b.type === 'IMAGE' || b.type === 'DIVIDER') return true;
                            const sanitized = sanitizeBlockContent(b.content || "").trim();
                            return sanitized !== '';
                        });

                        if (validBlocks.length > 0) {
                            const blocksPayload = validBlocks.map((b, i) => {
                                const sanitized = b.type === 'H2' ? b.content.replace(/\\s+/g, ' ').trim() : b.content;
                                return {
                                    idx: i,
                                    contentText: sanitized,
                                    blockType: b.type || 'PARAGRAPH',
                                    blockStyle: JSON.stringify({ align: b.align || 'left', color: '#2d342b', fontSize: '14px' })
                                };
                            });
                            await BlockService.createBlocksWithIdx(theNewId as string, blocksPayload);
                        }
                        
                        setIsImportModalOpen(false);
                        // Redirect directly to the editor to review the beautiful parse
                        router.push(\`/dashboard/pdcm/materials/\${theNewId}/edit?syllabusId=\${syllabusId}&taskId=\${taskId}\`);
                    } catch(err) {
                        console.error('Import error', err);
                        alert('Error importing material: ' + err.message);
                    }
                }}`;

content = content.replace(onImportOld, onImportNew);
// Fallback if not found exact spacing
content = content.replace(/onImport=\{\s*async\s*\(\s*file\s*\)\s*=>\s*\{[\s\S]*?console\.log\("Importing material file:", file\);[\s\S]*?await new Promise.*?;\s*\/\/\s*TODO[\s\S]*?\}\}/g, onImportNew);

fs.writeFileSync(materialsPagePath, content, 'utf8');
console.log('materials/page.tsx updated.');
