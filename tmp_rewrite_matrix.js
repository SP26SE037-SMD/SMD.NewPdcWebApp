const fs = require('fs');

const tsxContent = `"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

const fetchPoPloMappings = async (curriculumId?: string) => {
  if (!curriculumId) return null;
  const res = await fetch(\`/api/po-plo-mappings/curriculum/\${curriculumId}\`);
  if (!res.ok) throw new Error("Failed to fetch PO-PLO mappings");
  return res.json();
};

export default function MappingMatrix({ curriculumId }: { curriculumId?: string }) {
  const { data: mappingRes, isLoading } = useQuery({
    queryKey: ["po-plo-mappings", curriculumId],
    queryFn: () => fetchPoPloMappings(curriculumId),
    enabled: !!curriculumId
  });

  const mappings = mappingRes?.data || [];
  
  // Extract unique POs and PLOs
  const poMap = new Map();
  const ploMap = new Map();

  mappings.forEach((m: any) => {
    if (m.poId) poMap.set(m.poId, { id: m.poId, code: m.poCode, desc: m.descriptionPo });
    if (m.ploId) ploMap.set(m.ploId, { id: m.ploId, code: m.ploCode, desc: m.descriptionPlo });
  });

  const pos = Array.from(poMap.values()).sort((a: any, b: any) => a.code.localeCompare(b.code));
  const plos = Array.from(ploMap.values()).sort((a: any, b: any) => a.code.localeCompare(b.code));

  const isMapped = (poId: string, ploId: string) => {
    return mappings.some((m: any) => m.poId === poId && m.ploId === ploId);
  };

  if (isLoading) return <div className="p-20 text-center">Loading mapping matrix...</div>;

  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      {/* Main Grid Content */}
      <section className="col-span-12 lg:col-span-8">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-headline">Outcome Correlation Grid</h3>
            <div className="flex items-center gap-6 text-xs font-semibold text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span> High
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span> Medium
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span> Low/None
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {pos.length === 0 || plos.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant italic border rounded-xl bg-surface">
                No PO-PLO mappings found for this curriculum.
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="w-1/3 p-4 text-left font-bold text-on-surface-variant bg-surface-container-low rounded-lg">Program Outcomes (PO)</th>
                    {plos.map((plo: any) => (
                      <th key={plo.id} className="p-4 text-center text-[10px] uppercase tracking-tighter bg-surface-container-low rounded-lg w-20">
                        {plo.code}<br />
                        <span className="font-normal normal-case line-clamp-1" title={plo.desc}>{plo.desc}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pos.map((po: any) => (
                    <tr key={po.id}>
                      <td className="p-4 font-medium bg-surface rounded-lg" title={po.desc}>
                        {po.code} {po.desc}
                      </td>
                      {plos.map((plo: any) => {
                        const mapped = isMapped(po.id, plo.id);
                        return (
                          <td key={plo.id} className={\`p-4 text-center rounded-lg \${mapped ? 'bg-primary/10' : 'bg-surface-container'}\`}>
                            {mapped && <span className="material-symbols-outlined text-primary text-xl font-bold">check</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Reviewer Notes Section */}
          <div className="mt-8 pt-8 border-t border-outline-variant/20">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rate_review</span>
              Reviewer Notes
            </h4>
            <div className="bg-surface-container-low rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <img alt="Reviewer 1" className="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQJ1NDyz483S6ffI0RHus7yEknweBVB1oPbRM4Zms84NQr_8R-KnHZIeWCOUk3O2VY0v-Zcxgeax0vIK2W6Me6RUrtRLPonKLjBDYsTGmtfF-dDa_YMCfCLxebW6YEWW6NH4qZnWB2d3FnU-eoehdJEqdwcMwlS3p2RWb7wd5fI4b1zDJC32XWNCZbJseJZzUmqRO_TvqHH2NglvNYcQr76VZ77ZjmC_oiw4ozupzceXSHeu8xQltjL5PYhMOHD3BGFKo510UTjliw"/>
                <span className="text-xs font-bold">Dr. Elena Rostova</span>
                <span className="text-[10px] text-on-surface-variant">2 hours ago</span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed">The alignment between CLO-102 and PLO-2 is exceptionally well-documented in the syllabus. I recommend increasing the weight of CLO-304 to better reflect the new accreditation standards for ethics.</p>
            </div>
            <div className="relative">
              <textarea className="w-full bg-white border border-outline-variant rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50" placeholder="Add a formal feedback note..." rows={2}></textarea>
              <button className="absolute bottom-3 right-3 text-primary font-bold text-xs uppercase tracking-wider">Post</button>
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar Widgets */}
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
        {/* Matrix Health Widget */}
        <div className="bg-primary text-on-primary rounded-3xl p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-6">Alignment Health</h3>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" fill="transparent" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12"></circle>
                  <circle cx="80" cy="80" fill="transparent" r="70" stroke="white" strokeDasharray="440" strokeDashoffset="66" strokeLinecap="round" strokeWidth="12"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold tracking-tighter">85%</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Excellent</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center mt-4 opacity-90 leading-relaxed px-4">
              This matrix meets 92% of the International Engineering Accord criteria. Only minor adjustments to Ethics coverage required.
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Statistics / Bento Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-2xl font-bold block">{pos?.length || 0}</span>
              <span className="text-[10px] text-on-surface-variant font-medium">Mapped POs</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-2xl font-bold block">{plos?.length || 0}</span>
              <span className="text-[10px] text-on-surface-variant font-medium">PLO Clusters</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-2xl font-bold block">02</span>
              <span className="text-[10px] text-on-surface-variant font-medium">Gaps Found</span>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="text-2xl font-bold block text-primary">01</span>
              <span className="text-[10px] text-on-surface-variant font-medium">Revision Req.</span>
            </div>
          </div>
        </div>
        
        {/* Program Banner */}
        <div className="relative group h-48 rounded-2xl overflow-hidden shadow-sm">
          <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Modern academic campus" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCESE6849puYfmdSxPvCMwnx1yYVj1Xhu1_a08HYdPZYoScqS_Wje0B252KfWGp9ntGZjGhfTQ5csCWRdS6YxB4Xw8z1BUtsaPDcx01ppdqe6kcBnvuyghKxjLtJeJkX9yMk9WA76hIBV8LkAbzvYlEM6GhW94wlmm5QCZ9YtEopvPxQx8SuFPzDEa-6FY2O4mCSSbYhmZofiK-3NQ1Q79cXMSbWFlDx8zASQLP94WL_B0_2e5D5ktPxL72tN1OxI2EmCleEM8AP__W"/>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent flex items-end p-6">
            <div>
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-white/30">Institution Insight</span>
              <h4 className="text-white font-bold mt-2 leading-tight">Faculty of Advanced Computing Standards</h4>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
`;

fs.writeFileSync('/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/mapping-matrix.tsx', tsxContent);
