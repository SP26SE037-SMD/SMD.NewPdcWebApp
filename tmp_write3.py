import sys

file_path = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('    return (\n        <div className="min-h-screen')
if idx == -1:
    idx = content.find('    return (')

new_jsx = """    return (
        <div className="max-w-7xl mx-auto px-8 py-10 bg-[#f8f9fa] text-[#2d3335] min-h-[calc(100vh-4rem)]">
          {/* Breadcrumb & Header */}
          <div className="mb-10 ml-4">
            <nav className="flex items-center gap-2 text-xs text-[#5a6062] mb-4 font-medium uppercase tracking-widest">
              <span className="cursor-pointer hover:underline" onClick={() => router.back()}>Curriculum Proposals</span>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-[#2d6a4f]">{curriculum?.curriculumCode || 'Loading...'}</span>
            </nav>
            <h1 className="text-5xl font-extrabold tracking-tighter text-[#2d3335] mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {curriculum?.major?.majorName || curriculum?.curriculumName || 'Computer Science'}
            </h1>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-[#b1f0ce] text-[#1d5c42] text-xs font-bold rounded-full">
                {curriculum?.status || 'Active Proposal'}
              </span>
              <span className="text-sm text-[#5a6062] flex items-center gap-1">
                <Calendar size={14} />
                Last updated {curriculum?.updatedAt ? new Date(curriculum.updatedAt).toLocaleDateString() : '2 days ago'}
              </span>
            </div>
          </div>

          {/* Custom Tabs System */}
          <div className="flex gap-8 mb-12 border-b-0 ml-4 overflow-x-auto no-scrollbar">
            <button className="pb-4 text-sm font-bold text-[#2d6a4f] border-b-2 border-[#2d6a4f] whitespace-nowrap">Major Overview</button>
            <button className="pb-4 text-sm font-medium text-[#5a6062] hover:text-[#2d6a4f] transition-colors whitespace-nowrap">Curriculum Info</button>
            <button className="pb-4 text-sm font-medium text-[#5a6062] hover:text-[#2d6a4f] transition-colors whitespace-nowrap">Mapping Matrix</button>
            <button className="pb-4 text-sm font-medium text-[#5a6062] hover:text-[#2d6a4f] transition-colors whitespace-nowrap">Semester Structure</button>
          </div>

          {/* Bento Layout Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Basic Info Card */}
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-[#ffffff] rounded-2xl p-8 shadow-[0px_2px_8px_rgba(45,51,53,0.08)]">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Core Description</h3>
                  <button className="p-2 hover:bg-[#f1f4f5] rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[#5a6062]">edit_note</span>
                  </button>
                </div>
                <p className="text-[#5a6062] leading-relaxed text-lg font-light italic">
                  "{curriculum?.description || "The Bachelor of Science provides a rigorous foundation in computational theory and practical software engineering. Our curriculum focuses on sustainable AI, high-performance computing, and cross-platform architecture, preparing students for the intellectual challenges of the next decade's digital economy."}"
                </p>
                <div className="mt-8 grid grid-cols-3 gap-6">
                  <div className="bg-[#f1f4f5] p-4 rounded-xl">
                    <span className="block text-[10px] uppercase tracking-wider text-[#5a6062] font-bold mb-1">Major Code</span>
                    <span className="text-[#2d6a4f] font-mono font-bold">{curriculum?.major?.majorCode || 'CS-2024'}</span>
                  </div>
                  <div className="bg-[#f1f4f5] p-4 rounded-xl">
                    <span className="block text-[10px] uppercase tracking-wider text-[#5a6062] font-bold mb-1">Total Credits</span>
                    <span className="text-[#2d6a4f] font-mono font-bold">{stats.totalCredits} Units</span>
                  </div>
                  <div className="bg-[#f1f4f5] p-4 rounded-xl">
                    <span className="block text-[10px] uppercase tracking-wider text-[#5a6062] font-bold mb-1">Duration</span>
                    <span className="text-[#2d6a4f] font-mono font-bold">{curriculum?.endYear && curriculum?.startYear ? `${curriculum.endYear - curriculum.startYear} Years` : '4 Years'}</span>
                  </div>
                </div>
              </section>

              {/* Program Outcomes Section */}
              <section className="bg-[#f1f4f5] rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-[#b1f0ce] text-[#2d6a4f] rounded-lg material-symbols-outlined">stars</span>
                    <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Program Outcomes (POs)</h3>
                  </div>
                  <span className="text-xs font-semibold text-[#5a6062] bg-[#dee3e6] px-3 py-1 rounded-full">{(pos && pos.length) || 5} Outcomes Defined</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pos && pos.length > 0 ? pos.map((po: any, idx: number) => (
                     <div key={po.poId || idx} className={`bg-[#ffffff] p-6 rounded-xl border-l-4 ${idx === 0 ? 'border-[#2d6a4f]' : 'border-[#2d6a4f]/40'} transition-transform hover:-translate-y-1`}>
                      <span className="text-xs font-bold text-[#2d6a4f] mb-2 block">{po.poCode || `PO-0${idx + 1}`}</span>
                      <p className="text-sm text-[#5a6062] leading-snug">{po.description || po.poName || 'Design and implement complex software systems using industry-standard paradigms.'}</p>
                    </div>
                  )) : (
                    <>
                      <div className="bg-[#ffffff] p-6 rounded-xl border-l-4 border-[#2d6a4f] transition-transform hover:-translate-y-1">
                        <span className="text-xs font-bold text-[#2d6a4f] mb-2 block">PO-01: Technical Mastery</span>
                        <p className="text-sm text-[#5a6062] leading-snug">Design and implement complex software systems using industry-standard paradigms.</p>
                      </div>
                      <div className="bg-[#ffffff] p-6 rounded-xl border-l-4 border-[#2d6a4f]/40 transition-transform hover:-translate-y-1">
                        <span className="text-xs font-bold text-[#2d6a4f] mb-2 block">PO-02: Ethical Innovation</span>
                        <p className="text-sm text-[#5a6062] leading-snug">Analyze the societal impact of computing through lenses of accessibility and sustainability.</p>
                      </div>
                      <div className="bg-[#ffffff] p-6 rounded-xl border-l-4 border-[#2d6a4f]/40 transition-transform hover:-translate-y-1">
                        <span className="text-xs font-bold text-[#2d6a4f] mb-2 block">PO-03: Analytical Rigor</span>
                        <p className="text-sm text-[#5a6062] leading-snug">Apply mathematical foundations to algorithm design and efficiency analysis.</p>
                      </div>
                      <div className="bg-[#ffffff] p-6 rounded-xl border-l-4 border-[#2d6a4f]/40 transition-transform hover:-translate-y-1">
                        <span className="text-xs font-bold text-[#2d6a4f] mb-2 block">PO-04: Collaboration</span>
                        <p className="text-sm text-[#5a6062] leading-snug">Communicate technical concepts effectively within diverse multidisciplinary teams.</p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Metadata Bento */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#2d6a4f] p-8 rounded-2xl text-[#e6ffee] shadow-lg">
                <h4 className="text-lg font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Review Progress</h4>
                <div className="flex items-end justify-between mb-4">
                  <span className="text-3xl font-black">65%</span>
                  <span className="text-xs opacity-80 mb-1">Stage 2 of 3</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-6">
                  <div className="w-[65%] h-full bg-white"></div>
                </div>
                <button 
                  onClick={handleApprove}
                  disabled={mutation.isPending}
                  className="w-full py-3 bg-white text-[#2d6a4f] rounded-xl font-bold text-sm hover:bg-[#b1f0ce] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                  Submit for Approval
                </button>
              </div>

              <div className="bg-[#ffffff] rounded-2xl p-6 shadow-[0px_2px_8px_rgba(45,51,53,0.08)]">
                <h4 className="text-sm font-bold text-[#2d3335] mb-4 uppercase tracking-wider">Stakeholders</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img alt="Faculty Head" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfiBzwFBHSCDQkQ9YE4tvs-7VSqP0Tq0OmhxBpCO1SiCneICoxO-vj3u2o83iZ_eoOQ1yC1jXDtGYwu6t986zsEBxTAIAxqjf9aQRhkVj6-m50Idy1n6esHwklPyW4CCHwST3SI64BIpHW8Uwv9NrBIJ8w8EdmA8CrQZiM38O0FoLijTXhshD0UoONsIzDu8HNhi6tkYQka7XYRWRe0QRhezBRZ7UwPJgUqpSpJiOqB5TQxQHHsB7mAK7bwjnhmZpWutB4YgJ4iQt3" />
                    <div>
                      <p className="text-sm font-bold">Dr. Alistair Vance</p>
                      <p className="text-[10px] text-[#5a6062] uppercase">Dept. Chair</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <img alt="Curriculum Coordinator" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXrIBZ1In-DwXMNdp7VBfmwpHJCV7wT4_vQMubqCBH2lguf-D3u4m6j6Q1QXO58fIg5v70psSPAqiRu8q5jHhfeeHBkZjq7xwIbgDNkZ83SXFpjfZH8kJcPHhqGNCtgcoZm0ZhUriLkPJ7GHvbt8KLh33E2iMkUGViNhkV4JMS_GCoj_y2ArECQP-Ovd1urIm6ZJsnHSOkd-PRrCl2nWPCL9yPtuLKdJQ7tLaseTYk7cpD_fqHWJzABDSGLPiO7N--jZONq4CepZ7E" />
                    <div>
                      <p className="text-sm font-bold">Elena Rodriguez</p>
                      <p className="text-[10px] text-[#5a6062] uppercase">Coordinator</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#2d6a4f]/10">
                <h4 className="text-sm font-bold text-[#2d3335] mb-4">Review Timeline</h4>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#2d6a4f] mt-1.5"></span>
                      <div className="w-px h-full bg-[#b1f0ce] mt-1"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2d3335]">Proposal Drafted</p>
                      <p className="text-[10px] text-[#5a6062]">Oct 12, 2024</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-[#2d6a4f] mt-1.5"></span>
                      <div className="w-px h-full bg-[#b1f0ce] mt-1"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2d3335]">Dean Review</p>
                      <p className="text-[10px] text-[#5a6062]">Oct 28, 2024</p>
                    </div>
                  </li>
                  <li className="flex gap-3 opacity-40">
                    <div className="flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full bg-slate-300 mt-1.5"></span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2d3335]">Senate Approval</p>
                      <p className="text-[10px] text-[#5a6062]">Expected Nov 15</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    );
}

"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content[:idx] + new_jsx)

print("Done")
