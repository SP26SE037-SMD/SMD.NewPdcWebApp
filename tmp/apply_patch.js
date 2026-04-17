const fs = require('fs');
const file = 'src/app/dashboard/pdcm/materials/[materialId]/edit/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const oldCode = `                        let parsedStyle: { align?: 'left' | 'center' | 'right', color?: string, fontSize?: string } = {};
                        try {
                            const styleJson = b.blockStyle || ''; // SWAPPED
                            if (styleJson && styleJson.startsWith('{')) {
                                parsedStyle = JSON.parse(styleJson);
                            } else {
                                parsedStyle = { align: (styleJson as any) || 'left' };
                            }
                        } catch (e) {
                            parsedStyle = { align: 'left' };
                        }

                        // Robust type mapping
                        let rawType = (b.blockType || b.blockStyle || 'PARAGRAPH').toUpperCase(); // SWAPPED`;

const newCode = `                        let parsedStyle: { align?: 'left' | 'center' | 'right', color?: string, fontSize?: string } = {};
                        
                        const val1 = b.blockStyle || '';
                        const val2 = b.blockType || '';
                        
                        let styleJson = '';
                        let rawTypeStr = '';
                        
                        // Decide which is the style JSON and which is the type
                        if (val1.startsWith('{')) {
                            styleJson = val1;
                            rawTypeStr = val2 || 'PARAGRAPH';
                        } else if (val2.startsWith('{')) {
                            styleJson = val2;
                            rawTypeStr = val1 || 'PARAGRAPH';
                        } else {
                            // If neither is JSON, assume blockStyle is the type
                            rawTypeStr = val1 || val2 || 'PARAGRAPH';
                        }

                        try {
                            if (styleJson) parsedStyle = JSON.parse(styleJson);
                        } catch (e) {
                            parsedStyle = { align: 'left' };
                        }

                        // Robust type mapping
                        let rawType = rawTypeStr.toUpperCase();`;

txt = txt.replace(oldCode, newCode);
fs.writeFileSync(file, txt);
