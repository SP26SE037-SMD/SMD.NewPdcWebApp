"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PoPloService } from "@/services/poplo.service";

export default function MappingMatrix({
	curriculumId,
}: {
	curriculumId?: string;
}) {
	const { data: mappingRes, isLoading } = useQuery({
		queryKey: ["po-plo-mappings", curriculumId],
		queryFn: () => PoPloService.getMappingsByCurriculum(curriculumId!),
		enabled: !!curriculumId,
	});

	const mappings = mappingRes?.data || [];

	// Extract unique POs and PLOs
	const poMap = new Map();
	const ploMap = new Map();

	mappings.forEach((m: any) => {
		if (m.poId)
			poMap.set(m.poId, { id: m.poId, code: m.poCode, desc: m.descriptionPo });
		if (m.ploId)
			ploMap.set(m.ploId, {
				id: m.ploId,
				code: m.ploCode,
				desc: m.descriptionPlo,
			});
	});

	const pos = Array.from(poMap.values()).sort((a: any, b: any) =>
		a.code.localeCompare(b.code),
	);
	const plos = Array.from(ploMap.values()).sort((a: any, b: any) =>
		a.code.localeCompare(b.code),
	);

	const isMapped = (poId: string, ploId: string) => {
		return mappings.some((m: any) => m.poId === poId && m.ploId === ploId);
	};

	if (isLoading)
		return <div className="p-10 text-center text-zinc-500">Loading mapping matrix...</div>;

	return (
		<div className="w-full pb-8">
			<section className="w-full">
				<div className="overflow-x-auto no-scrollbar">
					{pos.length === 0 || plos.length === 0 ? (
						<div className="p-8 text-center text-zinc-400 italic border rounded-xl bg-zinc-50/50">
							No PO-PLO mappings found for this curriculum.
						</div>
					) : (
						<div className="bg-white border border-zinc-200 rounded-[1.25rem] overflow-visible shadow-sm inline-block min-w-full">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b border-zinc-200">
										<th className="px-8 py-5 text-left text-[11px] font-black text-zinc-500 uppercase tracking-widest sticky left-0 z-10 bg-white min-w-[250px]">
											Program Objectives (PO)
										</th>
										{plos.map((plo: any) => (
											<th
												key={plo.id}
												className="px-6 py-5 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:bg-zinc-50 transition-colors min-w-[100px]"
											>
												<div className="relative inline-flex items-center justify-center group/desc">
													<span className="cursor-help">{plo.code}</span>
													{plo.desc && (
														<div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-64 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[12px] font-semibold normal-case tracking-normal text-zinc-900 shadow-xl opacity-0 translate-y-1 group-hover/desc:opacity-100 group-hover/desc:translate-y-0 transition-all">
															{plo.desc}
														</div>
													)}
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{pos.map((po: any, index: number) => (
										<tr key={po.id} className={index !== pos.length - 1 ? "border-b border-zinc-100" : ""}>
											<td
												className="px-8 py-6 bg-white sticky left-0 z-10"
											>
												<div className="relative inline-flex items-center group/desc">
													<span className="font-bold text-[13px] text-[#2c533e] cursor-help">{po.code}</span>
													{po.desc && (
														<div className="pointer-events-none absolute top-full mt-2 left-0 z-30 w-80 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] font-semibold normal-case tracking-normal text-zinc-900 shadow-xl opacity-0 translate-y-1 group-hover/desc:opacity-100 group-hover/desc:translate-y-0 transition-all">
															{po.desc}
														</div>
													)}
												</div>
											</td>
											{plos.map((plo: any) => {
												const mapped = isMapped(po.id, plo.id);
												return (
													<td
														key={plo.id}
														className="px-6 py-6 text-center"
													>
														{mapped ? (
															<div className="mx-auto flex items-center justify-center w-8 h-8 bg-[#bdf0d4] text-[#18593a] rounded-lg">
																<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
															</div>
														) : (
															<span className="text-zinc-300 font-bold text-lg">—</span>
														)}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

		</div>
	);
}
