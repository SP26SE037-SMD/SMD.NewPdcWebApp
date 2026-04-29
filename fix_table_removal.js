const fs = require('fs');
const file = "src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx";
let content = fs.readFileSync(file, 'utf8');

const tableCode = `{assessments.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-white shadow-sm custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#f8faf2] text-on-surface font-bold border-b border-outline-variant/30 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-center border-r border-outline-variant/30 w-12">#</th>
                                        <th className="px-4 py-3 border-r border-outline-variant/30 whitespace-nowrap">Category (Part)</th>
                                        <th className="px-4 py-3 border-r border-outline-variant/30 whitespace-nowrap">Type</th>
                                        <th className="px-4 py-3 text-center border-r border-outline-variant/30 w-20">Weight</th>
                                        <th className="px-4 py-3 text-center border-r border-outline-variant/30 w-24">Duration</th>
                                        <th className="px-4 py-3 border-r border-outline-variant/30">Eval Range</th>
                                        <th className="px-4 py-3 border-r border-outline-variant/30">Methodology</th>
                                        <th className="px-4 py-3 text-center w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.map((ass, index) => (
                                        <tr key={ass.assessmentId || \`local-\${index}\`} className="border-b border-outline-variant/20 hover:bg-slate-50 transition-colors last:border-b-0">
                                            <td className="px-4 py-3 text-center font-bold border-r border-outline-variant/30 text-primary">{index + 1}</td>
                                            <td className="px-4 py-3 border-r border-outline-variant/30 font-medium">
                                                {ass.categoryName} {ass.part ? \`- Part \${ass.part}\` : ''}
                                            </td>
                                            <td className="px-4 py-3 border-r border-outline-variant/30">
                                                <span className={\`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold \${ass.typeName?.toLowerCase().includes('formative') ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}\`}>
                                                    {ass.typeName}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-outline-variant/30 font-bold">{ass.weight}%</td>
                                            <td className="px-4 py-3 text-center border-r border-outline-variant/30 text-xs">{ass.duration} Min</td>
                                            <td className="px-4 py-3 border-r border-outline-variant/30 text-xs truncate max-w-[150px]" title={ass.completionCriteria || ''}>{ass.completionCriteria || 'N/A'}</td>
                                            <td className="px-4 py-3 border-r border-outline-variant/30 text-xs truncate max-w-[150px]">{ass.questionType || 'Standard'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button onClick={() => setExpandedIndex(index)} className="text-secondary hover:text-primary transition-colors" title="Edit">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button onClick={() => ass.assessmentId ? handleDeleteApi(ass.assessmentId, index) : handleDeleteLocal(index)} className="text-error hover:text-red-700 transition-colors" title="Delete">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant/50">
                            <span className="material-symbols-outlined text-4xl mb-3">inbox</span>
                            <p className="text-sm font-medium">No assessments added yet.</p>
                        </div>
                    )}`;

// Match exactly from {assessments.map((ass, index) => ( up to the corresponding ))} for the component
const regex = /\{assessments\.map\(\(ass, index\) => \([\s\S]*?\}\)\)/;

// Wait, the previous regex failed because in `ass.typeName?.toLowerCase().includes('formative') ? '...' : '...'` 
// there was no `}))`, but wait! `}))` was at line 321.
// Let's use indexOf and string slicing to be absolutely safe instead of regex.

const startStr = "{assessments.map((ass, index) => (";
const startIdx = content.indexOf(startStr);
if(startIdx !== -1) {
    const emptyStateStr = "{/* Empty State / Add Action */}";
    const endIdx = content.indexOf(emptyStateStr, startIdx);
    
    // So the part to replace is from startIdx to endIdx (minus indentation).
    // Let's find the `}))` immediately preceding `emptyStateStr`:
    const blockEnd = content.lastIndexOf("}))", endIdx) + 3;
    
    const before = content.substring(0, startIdx);
    const after = content.substring(blockEnd);
    
    content = before + tableCode + after;
    fs.writeFileSync(file, content);
    console.log("Table code successfully injected safely.");
} else {
    console.log("Could not find start str");
}

