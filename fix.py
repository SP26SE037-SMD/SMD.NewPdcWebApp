import os
import re

path = 'UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx'
with open(path, 'r') as f:
    text = f.read()

# Make sure state exists
if 'const [activeTab, setActiveTab]' not in text:
    text = text.replace(
        'const [expandedElectives, setExpandedElectives] = useState<Set<string>>(new Set());',
        'const [expandedElectives, setExpandedElectives] = useState<Set<string>>(new Set());\n    const [activeTab, setActiveTab] = useState<"overview" | "info" | "matrix" | "structure">("overview");'
    )

# Replace tabs block
tabs_block = """{/* Custom Tabs System */}
          <div className="flex gap-12 mb-12 border-b-0 relative ml-4 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab("overview")} className={`pb-4 font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-[#2d6a4f] font-bold' : 'text-[#5a6062] hover:text-[#2d6a4f]'}`}>
                Major Overview
                {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>}
            </button>
            <button onClick={() => setActiveTab("info")} className={`pb-4 font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'info' ? 'text-[#2d6a4f] font-bold' : 'text-[#5a6062] hover:text-[#2d6a4f]'}`}>
                Curriculum Info
                {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>}
            </button>
            <button onClick={() => setActiveTab("matrix")} className={`pb-4 font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'matrix' ? 'text-[#2d6a4f] font-bold' : 'text-[#5a6062] hover:text-[#2d6a4f]'}`}>
                Mapping Matrix
                {activeTab === 'matrix' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>}
            </button>
            <button onClick={() => setActiveTab("structure")} className={`pb-4 font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'structure' ? 'text-[#2d6a4f] font-bold' : 'text-[#5a6062] hover:text-[#2d6a4f]'}`}>
                Semester Structure
                {activeTab === 'structure' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>}
            </button>
          </div>"""

text = re.sub(r'\{\/\* Custom Tabs System \*\/\}.*?<\/div>', tabs_block, text, flags=re.DOTALL)

# Replace outer bento layout to wrap the condition activeTab === 'overview'
bento_block = """{/* Bento Layout Content */}
          <div className="ml-4">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">"""

text = re.sub(r'\{\/\* Bento Layout Content \*\/\}\s*<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">', bento_block, text)

# Find the end of tracking timeline
tracker_end = """</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    );
}"""

target_end = """</p>
                                                        </div>
                                                </li>
                                        </ul>
                                </div>
                        </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8">
                    <section className="bg-[#f1f4f5] p-1 rounded-xl">
                      <div className="bg-[#ffffff] p-8 rounded-lg shadow-[0px_4px_20px_rgba(45,51,53,0.04),_0px_2px_8px_rgba(45,51,53,0.08)] h-full">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-2xl font-bold tracking-tight text-[#1d5c42]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Program Learning Outcomes</h3>
                          <span className="text-xs font-semibold text-[#5a6062] bg-[#dee3e6] px-3 py-1 rounded-full">{plos?.length || 0} PLOs</span>
                        </div>
                        <div className="space-y-8">
                          {plos && plos.length > 0 ? (
                            plos.map((plo: any, idx: number) => (
                              <div key={plo.ploId || idx} className="flex gap-6 group">
                                <div className="flex-shrink-0 w-12 h-12 bg-[#b1f0ce] rounded-xl flex items-center justify-center text-[#1d5c42] font-black text-lg">
                                  {idx + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-[#2d3335] mb-2 leading-snug">{plo.ploName || f"Outcome {idx + 1}"}</h4>
                                  <p className="text-[#5a6062] text-sm leading-relaxed">{plo.description}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-[#5a6062]">No PLOs mapped currently.</div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === 'matrix' && (
                <div className="space-y-8">
                  <section className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                      <h2 className="text-4xl font-black text-[#2d3335] tracking-tight mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>PO to PLO Matrix</h2>
                      <p className="text-[#5a6062] text-lg max-w-2xl leading-relaxed">Assess the alignment integrity between Program Objectives and Program Learning Outcomes.</p>
                    </div>
                  </section>
                  <div className="bg-[#ffffff] rounded-2xl shadow-sm border border-[#dee3e6] overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f1f4f5]/50">
                            <th className="p-6 border-b border-[#dee3e6] text-sm font-bold text-[#5a6062] uppercase tracking-wider w-1/3 min-w-[300px]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Program Objectives (PO)</th>
                            {plos.map((plo: any, i: number) => (
                              <th key={plo.ploId || i} className="p-4 border-b border-[#dee3e6] text-[11px] font-bold text-[#5a6062] uppercase tracking-widest text-center min-w-[120px]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {plo.ploName}
                                <span className="normal-case font-normal block mt-1 text-[10px] truncate max-w-[100px] mx-auto" title={plo.description}>{plo.description}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dee3e6]/50">
                          {pos.map((po: any) => (
                            <tr key={po.poId} className="hover:bg-[#f1f4f5]/50 transition-colors">
                              <td className="p-6">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-[#2d6a4f] mb-1">{po.poCode || po.poName}</span>
                                  <span className="text-sm font-semibold text-[#2d3335] leading-tight">{po.description}</span>
                                </div>
                              </td>
                              {plos.map((plo: any) => {
                                const mapped = isMapped(po.poId, plo.ploId);
                                return (
                                  <td key={plo.ploId} className="p-4 text-center">
                                    <div className="flex justify-center">
                                      {mapped ? (
                                        <div className="w-8 h-8 rounded-lg bg-[#b1f0ce] text-[#1d5c42] flex items-center justify-center">
                                          <span className="material-symbols-outlined text-lg" style={{fontVariationSettings: "'wght' 700"}}>check</span>
                                        </div>
                                      ) : (
                                        <span className="text-[#adb3b5]">—</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'structure' && (
                <div className="space-y-12 max-w-5xl">
                  {Array.from(new Set(mappings.map((m: any) => Math.ceil((m.semester || 1) / 2)))).map((year) => {
                    const semsInYear = mappings.filter((m: any) => Math.ceil((m.semester || 1) / 2) === year);
                    return (
                      <section key={`year-${year as number}`}>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-px flex-1 bg-[#dee3e6]"></div>
                          <h2 className="text-lg font-bold text-[#5a6062] flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            <span className="material-symbols-outlined text-[#2d6a4f]" style={{fontVariationSettings: "'FILL' 1"}}>
                              {year === 1 ? 'calendar_today' : 'calendar_month'}
                            </span>
                            Year {year as number}
                          </h2>
                          <div className="h-px flex-1 bg-[#dee3e6]"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {semsInYear.map((semesterData: any) => (
                             <div key={`sem-${semesterData.semester}`} className="space-y-4">
                               <h3 className="font-bold text-sm text-[#2d3335] tracking-wide px-2 uppercase">Semester {String(semesterData.semester).padStart(2, '0')}</h3>
                               <div className="bg-[#f1f4f5] rounded-2xl p-4 space-y-3 min-h-[150px]">
                                  {semesterData.subjects && semesterData.subjects.length > 0 ? (
                                      semesterData.subjects.map((sub: any) => (
                                        <div key={sub.subjectId || sub.subjectCode} className={`bg-[#ffffff] p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${sub.status === 'DRAFT' ? 'border-l-4 border-yellow-400' : 'border-l-4 border-[#2d6a4f]/20'}`}>
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-[#2d6a4f] tracking-widest">{sub.subjectCode}</span>
                                            <span className="text-[10px] font-semibold text-[#5a6062] bg-[#f1f4f5] px-2 py-0.5 rounded">{sub.credit || sub.credits || 3} Credits</span>
                                          </div>
                                          <h4 className="text-sm font-bold text-[#2d3335] leading-tight">{sub.subjectName || sub.translatedName}</h4>
                                        </div>
                                      ))
                                  ) : (
                                      <div className="p-4 text-center text-sm text-[#5a6062] italic flex items-center justify-center h-full gap-2">No subjects</div>
                                  )}
                               </div>
                             </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
    );
}"""

# A simple regex to replace the final lines.
text = re.sub(r'<\/p>\s*<\/div>\s*<\/li>\s*<\/ul>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}', target_end, text)

# Backup original and write new
os.rename(path, path + '.bak')
with open(path, 'w') as f:
    f.write(text)

print("done")
