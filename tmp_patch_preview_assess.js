const fs = require('fs');

function patchAssess(filepath) {
    let code = fs.readFileSync(filepath, 'utf8');

    // old list pattern in assessment:
    const oldListPattern = /<div className="space-y-4">[\s\S]*?\{previewData\.map\(\(item, idx\) => \([\s\S]*?<div key=\{idx\} className="p-4 border border-outline-variant\/20 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-2">[\s\S]*?<\/div>[\s\S]*?\)\)\}[\s\S]*?<\/div>/;
    
    const newList_assess = `
                                <div className="flex flex-col h-full animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center mb-4 mt-2">
                                        <h3 className="text-lg font-bold text-on-surface">Data Preview</h3>
                                        <button
                                            onClick={() => {
                                                setPreviewData([]);
                                                setIsPreviewOpen(false);
                                                setIsImportModalOpen(true);
                                                if(document.getElementById('excel-upload-hidden')) {
                                                    document.getElementById('excel-upload-hidden').value = '';
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
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">Row</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Category</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Type</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">Weight</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">Duration</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Matched CLOs</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/10">
                                                {previewData.slice((previewPage - 1) * 10, previewPage * 10).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-400 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">{item._rowNum}</span></td>
                                                        <td className="px-4 py-3 font-bold text-slate-800">{item.categoryName}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-600">{item.typeName}</td>
                                                        <td className="px-4 py-3 font-black text-primary">{item.weight}%</td>
                                                        <td className="px-4 py-3 text-slate-500">{item.duration} Min</td>
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
    `;

    code = code.replace(oldListPattern, newList_assess.trim());
    fs.writeFileSync(filepath, code);
}

patchAssess('src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx');
