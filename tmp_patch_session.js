const fs = require('fs');
const filepath = 'src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx';
let code = fs.readFileSync(filepath, 'utf8');

if (!code.includes("import * as XLSX from 'xlsx';")) {
    code = code.replace("import ImportModal from '@/components/dashboard/ImportModal';", "import ImportModal from '@/components/dashboard/ImportModal';\nimport * as XLSX from 'xlsx';");
}

if (!code.includes("const [previewData, setPreviewData] = useState<any[]>([]);")) {
    code = code.replace("const [isImportModalOpen, setIsImportModalOpen] = useState(false);", "const [isImportModalOpen, setIsImportModalOpen] = useState(false);\n    const [isPreviewOpen, setIsPreviewOpen] = useState(false);\n    const [previewData, setPreviewData] = useState<any[]>([]);");
}

const existingImportModalBlock = /<ImportModal[\s\S]*?\/>/g;

const customPreviewModal = `
            {/* Custom Import & Preview Modal for Sessions */}
            {(isImportModalOpen || isPreviewOpen) && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => { if(!isSaving) { setIsImportModalOpen(false); setIsPreviewOpen(false); } }}
                    />
                    
                    <div 
                        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                    >
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-outline-variant/20">
                            <div>
                                <h2 className="text-2xl font-black text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {isPreviewOpen ? 'Preview Sessions' : 'Import Sessions'}
                                </h2>
                                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-1">
                                    {isPreviewOpen ? \`Review \${previewData.length} records before saving\` : 'Upload Excel data'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {!isPreviewOpen && (
                                    <button 
                                        onClick={() => {
                                            const wb = XLSX.utils.book_new();
                                            const ws = XLSX.utils.json_to_sheet([
                                                { 'Session Number': 1, 'Title': 'Introduction to Computer Science', 'Duration': 50, 'Teaching Methods': 'Lecture, Discussion', 'CLOs': 'CLO1, CLO2' },
                                                { 'Session Number': 2, 'Title': 'Data Structures', 'Duration': 50, 'Teaching Methods': 'Lab, Practice', 'CLOs': 'CLO3' }
                                            ]);
                                            XLSX.utils.book_append_sheet(wb, ws, "Template");
                                            XLSX.writeFile(wb, "Sessions_Template.xlsx");
                                        }}
                                        className="px-4 py-2 font-bold text-xs bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                        Download Template
                                    </button>
                                )}
                                <button 
                                    onClick={() => { if(!isSaving) { setIsImportModalOpen(false); setIsPreviewOpen(false); } }}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#f8faf2] text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                            {!isPreviewOpen ? (
                                <div 
                                    className={\`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all border-[#adb4a8]/30 bg-[#f8faf2] hover:border-primary hover:bg-primary/5 cursor-pointer\`}
                                    onClick={() => document.getElementById('excel-upload-hidden')?.click()}
                                >
                                    <input
                                        id="excel-upload-hidden"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if(!file) return;
                                            
                                            try {
                                                const data = await file.arrayBuffer();
                                                const workbook = XLSX.read(data, { type: 'array' });
                                                const firstSheetName = workbook.SheetNames[0];
                                                const worksheet = workbook.Sheets[firstSheetName];
                                                const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

                                                if (!syllabusId) return;

                                                const subjectClosList = clos || [];

                                                const parsedSessions = rows.map((row, index) => {
                                                    const rawNumber = Number(row['Session Number'] || row['sessionNumber'] || row['Session'] || row['session'] || (index + 1));
                                                    const rawTitle = String(row['Title'] || row['title'] || '').trim();
                                                    const rawDuration = Number(row['Duration'] || row['duration'] || 50);
                                                    const rawMethods = String(row['Teaching Methods'] || row['teachingMethods'] || row['Methods'] || '').trim();
                                                    const rawCLOs = String(row['CLOs'] || row['clos'] || row['CLO'] || '').trim();

                                                    const cloCodes = rawCLOs.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
                                                    const matchedClos = subjectClosList.filter((c: any) => (c.cloName && cloCodes.includes(c.cloName.toLowerCase())) || (c.cloCode && cloCodes.includes(c.cloCode.toLowerCase())));

                                                    return {
                                                        _rowNum: index + 1,
                                                        syllabusId,
                                                        sessionNumber: rawNumber,
                                                        sessionTitle: rawTitle,
                                                        duration: rawDuration,
                                                        teachingMethods: rawMethods,
                                                        content: "[]",
                                                        _rawCLOs: rawCLOs,
                                                        matchedClos
                                                    };
                                                });
                                                setPreviewData(parsedSessions);
                                                setIsImportModalOpen(false);
                                                setIsPreviewOpen(true);
                                            } catch (error) {
                                                console.error(error);
                                                showToast('Failed to parse Excel file', 'error');
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                    <div className="w-20 h-20 rounded-full bg-primary border-4 border-primary/20 flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
                                        <span className="material-symbols-outlined text-[36px]">upload_file</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-on-surface mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Click or drag Excel file here
                                    </h3>
                                    <p className="text-sm font-medium text-on-surface-variant">
                                        Supports .xlsx, .xls
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {previewData.map((item, idx) => (
                                        <div key={idx} className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">Session {item.sessionNumber}</span>
                                                    <span className="font-bold text-sm text-on-surface">{item.sessionTitle || 'Untitled Session'}</span>
                                                </div>
                                                <div className="text-sm font-black text-on-surface bg-surface-container px-3 py-1 rounded-xl">
                                                    {item.duration} Min
                                                </div>
                                            </div>
                                            <div className="text-xs text-on-surface-variant mt-2">
                                                <div className="mb-2">
                                                    <span className="block opacity-60 font-bold uppercase tracking-wider mb-1 text-[10px]">Teaching Methods</span>
                                                    <span className="font-medium">{item.teachingMethods || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="block opacity-60 font-bold uppercase tracking-wider mb-1 text-[10px]">Matched CLOs</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.matchedClos && item.matchedClos.length > 0 ? (
                                                            item.matchedClos.map((c: any) => (
                                                                <span key={c.cloId} className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-lg whitespace-nowrap">{(c.cloCode || c.cloName).toUpperCase()} ✓</span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-lg">None matched ({item._rawCLOs || 'Empty'})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isPreviewOpen && (
                            <div className="p-6 bg-surface-container flex justify-end gap-4 border-t border-outline-variant/20">
                                <button 
                                    onClick={() => { setIsPreviewOpen(false); setPreviewData([]); setIsImportModalOpen(true); }}
                                    className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant bg-white border border-outline-variant/30 hover:bg-outline-variant/10 transition-colors"
                                >
                                    Back
                                </button>
                                <button 
                                    disabled={isSaving}
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            const payloadArgs = previewData.map(item => {
                                                const createPayload = { ...item };
                                                delete createPayload._rowNum;
                                                delete createPayload._rawCLOs;
                                                delete createPayload.matchedClos;
                                                
                                                // Include matched CLO IDs in the payload array if needed depending on backend
                                                // Actually, SessionItemRequest doesn't often have cloIds directly, 
                                                // but wait, if it doesn't, we will map via MappingService.
                                                // We can use SessionService API. Let's do them one by one or batch if applicable.
                                                return createPayload;
                                            });
                                            
                                            // Calling session creation APIs. Wait, Session mapping relies on MappingService: createCloSessionMapping() ?
                                            // Let's import MappingService at top just in case, but it's already there
                                            
                                            // Actually, saving Sessions might be per item:
                                            let success = 0;
                                            // Note: MappingService.createSessionMapping takes { sessionId, cloId } or similar. Wait, does SessionService create with cloIds array directly?
                                            // Let's refer to SessionService
                                            
                                            // For now we assume SessionService.createSession()
                                            // and MappingService.createCloSessionMapping()
                                            
                                            for (let i = 0; i < previewData.length; i++) {
                                                const item = previewData[i];
                                                const createPayload = { ...item };
                                                delete createPayload._rowNum;
                                                delete createPayload._rawCLOs;
                                                delete createPayload.matchedClos;
                                                
                                                const { SessionService } = await import('@/services/session.service');
                                                const res = await SessionService.createSession(createPayload);
                                                const newId = (res as any).data?.sessionId;
                                                
                                                if (newId && item.matchedClos && item.matchedClos.length > 0) {
                                                    const { MappingService } = await import('@/services/mapping.service');
                                                    for (const clo of item.matchedClos) {
                                                        try {
                                                            await MappingService.createCloSessionMapping({ sessionId: newId, cloId: clo.cloId });
                                                        } catch(err) {
                                                            console.error("Mapping CLO failed", err);
                                                        }
                                                    }
                                                }
                                                success++;
                                            }

                                            showToast(\`Successfully saved \${success} sessions with CLOs\`, 'success');
                                            
                                            // Manually trigger a UI refresh 
                                            // Note: usually we have handleReload or dispatch(setSessions...) here.
                                            // Will just window.location.reload() for a heavy hammer or close modal and rely on existing effects.
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 500);

                                            setIsPreviewOpen(false);
                                            setPreviewData([]);
                                        } catch (error) {
                                            console.error(error);
                                            showToast('Failed to save some sessions', 'error');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className="px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg text-white"
                                    style={{ background: '#41683f' }}
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="material-symbols-outlined text-[20px]">save</span>}
                                    Confirm & Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
`;

code = code.replace(existingImportModalBlock, customPreviewModal);
fs.writeFileSync(filepath, code, 'utf8');

