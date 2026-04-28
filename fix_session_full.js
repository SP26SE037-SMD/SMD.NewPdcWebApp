const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx', 'utf8');

// 1. Add xlsx import
if(!code.includes("import * as XLSX from 'xlsx'")) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport * as XLSX from 'xlsx';");
}

// 2. State definitions 
// Look closely:
const stateTarget = /const \[isSaving, setIsSaving\] = useState\(false\);/;
if(stateTarget.test(code) && !code.includes("const [isPreviewOpen")) {
    code = code.replace(
        stateTarget,
        `const [isSaving, setIsSaving] = useState(false);\n    const [isImportModalOpen, setIsImportModalOpen] = useState(false);\n    const [isPreviewOpen, setIsPreviewOpen] = useState(false);\n    const [previewData, setPreviewData] = useState<any[]>([]);\n    const [previewPage, setPreviewPage] = useState(1);`
    );
}

// 3. Add Import Button next to New Session
const btnRegex = /<button\n\s*onClick=\{handleCreateNew\}[\s\S]*?<\/button>/;
const newBtnHTML = `
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8]"
                        style={{ borderColor: '#2d342b', color: '#2d342b', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import
                    </button>`;
if(btnRegex.test(code) && !code.includes("onClick={() => setIsImportModalOpen(true)}")) {
    code = code.replace(btnRegex, (match) => {
        return match + '\n' + newBtnHTML;
    });
}

// 4. Modal block at the very bottom
const modalJSX = `
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
                                    className="border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all border-[#adb4a8]/30 bg-[#f8faf2] hover:border-primary hover:bg-primary/5 cursor-pointer"
                                    onClick={() => {
                                        const el = document.getElementById('excel-upload-hidden');
                                        if (el) el.click();
                                    }}
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
                                                const rows = XLSX.utils.sheet_to_json(worksheet);

                                                if (!syllabusId) return;

                                                const subjectClosList = clos || [];

                                                const parsedSessions = rows.map((row: any, index) => {
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
                                                setPreviewPage(1);
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
<div className="flex flex-col h-full animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center mb-4 mt-2">
                                        <h3 className="text-lg font-bold text-on-surface">Data Preview</h3>
                                        <button
                                            onClick={() => {
                                                setPreviewData([]);
                                                setIsPreviewOpen(false);
                                                setIsImportModalOpen(true);
                                                if(document.getElementById('excel-upload-hidden')) {
                                                    (document.getElementById('excel-upload-hidden') as any).value = '';
                                                }
                                            }}
                                            className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">delete</span> Delete & Upload New
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-auto border border-outline-variant/20 rounded-xl bg-white shadow-sm max-h-[50vh]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap w-20">Session</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Title</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap w-24">Duration</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Methods</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 w-56">Matched CLOs</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/10">
                                                {previewData.slice((previewPage - 1) * 10, previewPage * 10).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-700 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">{item.sessionNumber}</span></td>
                                                        <td className="px-4 py-3 font-bold text-slate-800">{item.sessionTitle || 'Untitled'}</td>
                                                        <td className="px-4 py-3 text-slate-500">{item.duration} Min</td>
                                                        <td className="px-4 py-3 text-slate-600 text-xs">{item.teachingMethods || 'N/A'}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.matchedClos && item.matchedClos.length > 0 ? (
                                                                    item.matchedClos.map((c: any) => (
                                                                        <span key={c.cloId} className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-lg whitespace-nowrap">{(c.cloCode || c.cloName).toUpperCase()} ✓</span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">None ({item._rawCLOs || 'Empty'})</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {previewData.length > 10 && (
                                        <div className="flex justify-between items-center mt-4 px-2">
                                            <span className="text-xs font-medium text-slate-400">
                                                Showing {((previewPage - 1) * 10) + 1} to {Math.min(previewPage * 10, previewData.length)} of {previewData.length} entries
                                            </span>
                                            <div className="flex gap-1 items-center">
                                                <button
                                                    disabled={previewPage === 1}
                                                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                                                    className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                                </button>
                                                <div className="flex gap-1 mx-2 overflow-x-auto max-w-[200px] custom-scrollbar py-1">
                                                    {Array.from({ length: Math.ceil(previewData.length / 10) }).map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setPreviewPage(i + 1)}
                                                            className={\`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm \${previewPage === i + 1 ? 'bg-primary text-white scale-110 shadow-primary/30' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'}\`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    disabled={previewPage === Math.ceil(previewData.length / 10)}
                                                    onClick={() => setPreviewPage(p => Math.min(Math.ceil(previewData.length / 10), p + 1))}
                                                    className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                            const { SessionService } = await import('@/services/session.service');
                                            const { MappingService } = await import('@/services/mapping.service');
                                            let success = 0;
                                            
                                            for (let i = 0; i < previewData.length; i++) {
                                                const item = previewData[i];
                                                const createPayload = { ...item };
                                                delete createPayload._rowNum;
                                                delete createPayload._rawCLOs;
                                                delete createPayload.matchedClos;
                                                
                                                const res = await SessionService.createSession(createPayload);
                                                const newId = (res as any).data?.sessionId;
                                                
                                                if (newId && item.matchedClos && item.matchedClos.length > 0) {
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
                                    {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                                    Confirm & Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
`;

if (!code.includes("Custom Import & Preview Modal for Sessions")) {
    code = code.replace("        </div>\n    );\n}", modalJSX + "\n        </div>\n    );\n}");
}

fs.writeFileSync('src/app/dashboard/pdcm/tasks/[taskId]/sessions/page.tsx', code);
console.log("Sessions page repaired!");
