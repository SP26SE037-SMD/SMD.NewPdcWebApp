"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

const fetchCurriculumDetail = async (id: string) => {
	if (!id) return null;
	const res = await fetch(`/api/curriculums/${id}`);
	if (!res.ok) throw new Error("Failed to fetch curriculum info");
	return res.json();
};

const fetchPLOs = async (curriculumId: string) => {
	if (!curriculumId) return null;
	const res = await fetch(`/api/plos/curriculum/${curriculumId}`);
	if (!res.ok) throw new Error("Failed to fetch PLOs");
	return res.json();
};

export default function CurriculumInfo({
	curriculumId,
}: {
	curriculumId: string;
}) {
	const { data: currRes, isLoading } = useQuery({
		queryKey: ["curriculumInfo", curriculumId],
		queryFn: () => fetchCurriculumDetail(curriculumId),
		enabled: !!curriculumId,
	});

	const { data: ploRes, isLoading: ploLoading } = useQuery({
		queryKey: ["plos", curriculumId],
		queryFn: () => fetchPLOs(curriculumId),
		enabled: !!curriculumId,
	});

	const currData = currRes?.data;
	const ploList = ploRes?.data?.content || [];

	if (isLoading) {
		return (
			<div className="text-center p-10 text-on-surface-variant">
				Loading Curriculum Info...
			</div>
		);
	}

	if (!currData) {
		return (
			<div className="text-center p-10 text-on-surface-variant">
				No Curriculum Info available.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-12 gap-8 max-w-6xl">
			{/* Metadata Bento Box */}
			<div className="col-span-12 md:col-span-5 flex flex-col gap-8">
				<section className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow">
					<h3 className="text-xl font-bold mb-6 text-emerald-900 flex items-center gap-2">
						<span className="material-symbols-outlined">info</span>
						Core Specifications
					</h3>
					<div className="space-y-6">
						<div className="group">
							<label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
								Academic Department
							</label>
							<p className="text-lg font-medium text-on-surface">
								School of Computer Science &amp; Engineering
							</p>
						</div>
						<div className="group">
							<label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
								Degree Level
							</label>
							<p className="text-lg font-medium text-on-surface">
								Undergraduate (Baccalaureate)
							</p>
						</div>
						<div className="group">
							<label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
								Effective Term
							</label>
							<div className="flex items-center gap-2">
								<span className="material-symbols-outlined text-primary-dim">
									calendar_today
								</span>
								<p className="text-lg font-medium text-on-surface">
									Autumn {currData?.startYear || "2024"}
								</p>
							</div>
						</div>
					</div>
				</section>

			</div>

			{/* PLO Section (Main Content) */}
			<div className="col-span-12 md:col-span-7">
				<section className="bg-surface-container-low p-1 rounded-xl">
					<div className="bg-surface-container-lowest p-8 rounded-lg editorial-shadow h-full">
						<div className="flex justify-between items-center mb-8">
							<h3 className="text-2xl font-bold tracking-tight text-emerald-900">
								Program Learning Outcomes
							</h3>
							<button className="text-primary hover:bg-primary-container px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
								<span className="material-symbols-outlined text-sm">edit</span>{" "}
								Edit
							</button>
						</div>

						{ploLoading ? (
							<div className="text-center p-4">Loading PLOs...</div>
						) : (
							<div className="space-y-8">
								{ploList.length > 0 ? (
									ploList.map((plo: any, idx: number) => (
										<div key={plo.ploId || idx} className="flex gap-6 group">
											<div className="flex-shrink-0 w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container font-black text-lg">
												{idx + 1}
											</div>
											<div>
												<h4 className="font-bold text-on-surface mb-2 leading-snug">
													{plo.ploName || `Learning Outcome ${idx + 1}`}
												</h4>
												<p className="text-on-surface-variant text-sm leading-relaxed">
													{plo.description}
												</p>
											</div>
										</div>
									))
								) : (
									<div className="text-sm text-on-surface-variant italic">
										No Program Learning Outcomes defined.
									</div>
								)}
							</div>
						)}

						<div className="mt-12 pt-8 border-t-0 bg-surface-container-low/30 -mx-8 -mb-8 p-8 flex justify-center">
							<button className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold text-sm transition-colors">
								<span className="material-symbols-outlined">expand_more</span>
								View All {ploList?.length || 0} Learning Outcomes
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
