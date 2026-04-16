const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api_docs.json', 'utf8'));
let out = 'API ENDPOINTS\n';
for (const [path, methods] of Object.entries(data.paths)) {
    if (path.toLowerCase().includes('curriculum') || path.toLowerCase().includes('group') || path.toLowerCase().includes('combo') || path.toLowerCase().includes('subject')) {
        out += `\n[${path}]\n`;
        for (const [m, details] of Object.entries(methods)) {
            out += `  ${m.toUpperCase()} - ${details.summary || ''}\n`;
            if (details.requestBody) {
                try {
                    const content = details.requestBody.content['application/json'].schema;
                    if (content.$ref) {
                        const schemaName = content.$ref.split('/').pop();
                        out += `  RequestBody: ${schemaName}\n`;
                        const props = data.components.schemas[schemaName].properties || {};
                        for (const [pName, pDetails] of Object.entries(props)) {
                            let pType = pDetails.type || ('ref: ' + (pDetails.$ref || ''));
                            if (pType === 'array') {
                                pType = `array of ${(pDetails.items.$ref || pDetails.items.type).split('/').pop()}`;
                            }
                            out += `    - ${pName}: ${pType}\n`;
                        }
                    } else if (content.type === 'array') {
                        out += `  RequestBody: Array of ${content.items.$ref ? content.items.$ref.split('/').pop() : content.items.type}\n`;
                    }
                } catch(e) {
                    out += `  RequestBody Error: ${e.message}\n`;
                }
            }
        }
    }
}
fs.writeFileSync('api_dump.txt', out);
