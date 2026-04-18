const fs = require('fs');
const file = `/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/vice-principal/curriculums/[id]/review/page.tsx`;

const content = `"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fetchRequest = async (id: string) => {
    if (!id) return null;
    const res = await fetch(\`/api/requests/\${id}\`);
    if (!res.ok) throw new Error("Failed to fetch request");
    return res.json();
};

const fetchPOs = async (majorId: string) => {
    if (!majorId) return null;
    const res = await fetch(\`/api/pos/major/\${majorId}\`);
    if (!res.ok) throw new Error("Failed to fetch POs");
    return res.json();
};

export default function MajorReviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const { data: requestRes, isLoading: reqLoading } = useQuery({
        queryKey: ["request", id],
        queryFn: () => fetchRequest(id),
    });

    const requestData = requestRes?.data;
    const majorId = requestData?.major?.majorId || requestData?.curriculum?.major?.majorId;

    const { data: poRes, isLoading: poLoading } = useQuery({
        queryKey: ["pos", majorId],
        queryFn: () => fetchPOs(majorId),
        enabled: !!majorId,
    });

    const poList = poRes?.data?.content || [];

    if (reqLoading)
        return <div className="p-20 text-center">Loading proposal...</div>;

    const curriculum = requestData?.curriculum;
    const major = requestData?.major || curriculum?.major;
    const createdBy = requestData?.createdBy;

    return (
        <div className="bg-surface text-on-surface min-h-screen font-plus-jakarta-sans tracking-tight">
            <main className="md:pl-10 pt-10 min-h-screen">
                <div className="max-w-7xl mx-auto px-8 py-10">
                    <div className="mb-10 ml-4">
                        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4 font-medium uppercase tracking-widest">
                            <span>Curriculum Proposals</span>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-primary">{curriculum?.curriculumCode || "CS-2024"}</span>
                        </nav>
                        <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-4">
                            {curriculum?.curriculumName || "Computer Science"}
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded-full">
                                {requestData?.status || "Active Proposal"}
                            </span>
                            <span className="text-sm text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                Last updated {requestData?.updatedAt ? formatDate(requestData.updatedAt) : "recently"}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-8 mb-12 border-b-0 ml-4 overflow-x-auto no-scrollbar">
                        <button className="pb-4 text-sm font-bold text-primary border-b-2 border-primary whitespace-nowrap">Major Overview</button>
                        <button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Curriculum Info</button>
                        <button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Mapping Matrix</button>
                        <button className="pb-4 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">Semester Structure</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0px_2px_8px_rgba(45,51,53,0.08)]">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-xl font-bold tracking-tight">Core Description</h3>
                                    <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-on-surface-variant">edit_note</span>
                                    </button>
                                </div>
                                <p className="text-on-surface-variant leading-relaxed text-lg font-light italic">
                                    "{major?.description || "The Bachelor of Science in Computer Science provides a rigorous foundation in computational theory and practical software engineering. Our 2024 curriculum focuses on sustainable AI, high-performance computing, and cross-platform architecture, preparing students for the intellectual challenges of the next decade's digital economy."}"
                                </p>
                                <div className="mt-8 grid grid-cols-3 gap-6">
                                    <div className="bg-surface-container-low p-4 rounded-xl">
                                        <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Major Code</span>
                                        <span className="text-primary font-mono font-bold">{major?.majorCode || "CS-2024"}</span>
                                    </div>
                                    <div className="bg-surface-container-low p-4 rounded-xl">
                                        <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Total Credits</span>
                                        <span className="text-primary font-mono font-bold">120 Units</span>
                                    </div>
                                    <div className="bg-surface-container-low p-4 rounded-xl">
                                        <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Duration</span>
                                        <span className="text-primary font-mono font-bold">
                                            {curriculum?.startYear && curriculum?.endYear ? \`\${curriculum.endYear - curriculum.startYear} Years\` : "4 Years"}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-surface-container-low rounded-2xl p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <span className="p-2 bg-primary-container text-primary rounded-lg material-symbols-outlined">stars</span>
                                        <h3 className="text-xl font-bold tracking-tight">Program Outcomes (POs)</h3>
                                    </div>
                                    <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full">
                                        {poList?.length || 0} Outcomes Defined
                                    </span>
                                </div>
                                
                                {poLoading ? (
                                    <div className="text-center p-4">Loading POs...</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {poList.length > 0 ? (
                                            poList.map((po: any, idx: number) => (
                                                <div key={po.poId || idx} className={\`bg-surface-container-lowest p-6 rounded-xl border-l-4 \${idx === 0 ? "border-primary" : "border-primary/40"} transition-transform hover:-translate-y-1\`}>
                                                    <span className="text-xs font-bold text-primary mb-2 block">{po.poCode || \`PO-0\${idx + 1}\`}</span>
                                                    <p className="text-sm text-on-surface-variant leading-snug">{po.description}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 text-center text-sm text-on-surface-variant italic">No program outcomes defined yet.</div>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-primary p-8 rounded-2xl text-on-primary shadow-lg">
                                <h4 className="text-lg font-bold mb-2">Review Progress</h4>
                                <div className="flex items-end justify-between mb-4">
                                    <span className="text-3xl font-black">65%</span>
                                    <span className="text-xs opacity-80 mb-1">Stage 2 of 3</span>
                                </div>
                                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-6">
                                    <div className="w-[65%] h-full bg-white"></div>
                                </div>
                                <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-primary-container transition-colors">
                                    Submit for Approval
                                </button>
                            </div>

                            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_2px_8px_rgba(45,51,53,0.08)]">
                                <h4 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wider">Stakeholders</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <img alt="Faculty Head" className="w-8 h-8 rounded-full object-cover" src={createdBy?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBfiBzwFBHSCDQkQ9YE4tvs-7VSqP0Tq0OmhxBpCO1SiCneICoxO-vj3u2o83iZ_eoOQ1yC1jXDtGYwu6t986zsEBxTAIAxqjf9aQRhkVj6-m50Idy1n6esHwklPyW4CCHwST3SI64BIpHW8Uwv9NrBIJ8w8EdmA8CrQZiM38O0FoLijTXhshD0UoONsIzDu8HNhi6tkYQka7XYRWRe0QRhezBRZ7UwPJgUqpSpJiOqB5TQxQHHsB7mAK7bwjnhmZpWutB4YgJ4iQt3"}/>
                                        <div>
                                            <p className="text-sm font-bold">{createdBy?.fullName || "Dr. Alistair Vance"}</p>
                                            <p className="text-[10px] text-on-surface-variant uppercase">{createdBy?.role?.roleName || "Dept. Chair"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <img alt="Curriculum Coordinator" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXrIBZ1In-DwXMNdp7VBfmwpHJCV7wT4_vQMubqCBH2lguf-D3u4m6j6Q1QXO58fIg5v70psSPAqiRu8q5jHhfeeHBkZjq7xwIbgDNkZ83SXFpjfZH8kJcPHhqGNCtgcoZm0ZhUriLkPJ7GHvbt8KLh33E2iMkUGViNhkV4JMS_GCoj_y2ArECQP-Ovd1urIm6ZJsnHSOkd-PRrCl2nWPCL9yPtuLKdJQ7tLaseTYk7cpD_fqHWJzABDSGLPiO7N--jZONq4CepZ7E"/>
                                        <div>
                                            <p className="text-sm font-bold">Elena Rodriguez</p>
                                            <p className="text-[10px] text-on-surface-variant uppercase">Coordinator</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-primary/10">
                                <h4 className="text-sm font-bold text-on-surface mb-4">Review Timeline</h4>
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="w-2 h-2 rounded-full bg-primary mt-1.5"></span>
                                            <div className="w-px h-full bg-primary-container mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-on-surface">Proposal Drafted</p>
                                            <p className="text-[10px] text-on-surface-variant">{requestData?.createdAt ? formatDate(requestData.createdAt) : "Oct 12, 2024"}</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="w-2 h-2 rounded-full bg-primary mt-1.5"></span>
                                            <div className="w-px h-full bg-primary-container mt-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-on-surface">Dean Review</p>
                                            <p className="text-[10px] text-on-surface-variant">Oct 28, 2024</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3 opacity-40">
                                        <div className="flex flex-col items-center">
                                            <span className="w-2 h-2 rounded-full bg-slate-300 mt-1.5"></span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-on-surface">Senate Approval</p>
                                            <p className="text-[10px] text-on-surface-variant">Expected Nov 15</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}`;

fs.writeFileSync(file, content);
