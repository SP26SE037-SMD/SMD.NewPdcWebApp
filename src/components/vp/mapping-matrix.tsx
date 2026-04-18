"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

const fetchPoPloMappings = async (curriculumId?: string) => {
	if (!curriculumId) return null;
	const res = await fetch(`/api/po-plo-mappings/curriculum/${curriculumId}`);
	if (!res.ok) throw new Error("Failed to fetch PO-PLO mappings");
	return res.json();
};

export default function MappingMatrix({
	curriculumId,
}: {
	curriculumId?: string;
}) {
	const { data: mappingRes, isLoading } = useQuery({
		queryKey: ["po-plo-mappings", curriculumId],
		queryFn: () => fetchPoPloMappings(curriculumId),
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
		return <div className="p-20 text-center">Loading mapping matrix...</div>;

	return (
		<div className="grid grid-cols-12 gap-8 items-start">
			{/* Main Grid Content */}
			<section className="col-span-12 lg:col-span-12">
				<div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden p-8">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-xl font-bold font-headline">
							Outcome Correlation Grid
						</h3>
						<div className="flex items-center gap-6 text-xs font-semibold text-on-surface-variant">
							<div className="flex items-center gap-2">
								<span className="w-3 h-3 rounded-full bg-primary"></span> High
							</div>
							<div className="flex items-center gap-2">
								<span className="w-3 h-3 rounded-full bg-primary-container"></span>{" "}
								Medium
							</div>
							<div className="flex items-center gap-2">
								<span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>{" "}
								Low/None
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
										<th className="w-1/3 p-4 text-left font-bold text-on-surface-variant bg-surface-container-low rounded-lg">
											Program Outcomes (PO)
										</th>
										{plos.map((plo: any) => (
											<th
												key={plo.id}
												className="p-4 text-center text-[10px] uppercase tracking-tighter bg-surface-container-low rounded-lg w-20"
											>
												{plo.code}
												<br />
												<span
													className="font-normal normal-case line-clamp-1"
													title={plo.desc}
												>
													{plo.desc}
												</span>
											</th>
										))}
									</tr>
								</thead>
								<tbody className="text-sm">
									{pos.map((po: any) => (
										<tr key={po.id}>
											<td
												className="p-4 font-medium bg-surface rounded-lg"
												title={po.desc}
											>
												{po.code} {po.desc}
											</td>
											{plos.map((plo: any) => {
												const mapped = isMapped(po.id, plo.id);
												return (
													<td
														key={plo.id}
														className={`p-4 text-center rounded-lg ${mapped ? "bg-primary/10" : "bg-surface-container"}`}
													>
														{mapped && (
															<span className="material-symbols-outlined text-primary text-xl font-bold">
																check
															</span>
														)}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</section>

		</div>
	);
}
