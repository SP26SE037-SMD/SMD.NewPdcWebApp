"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

const fetchSemesterStructure = async (curriculumId?: string) => {
	if (!curriculumId) return null;
	const res = await fetch(
		`/api/curriculum-group-subjects/semester-mappings?curriculumId=${curriculumId}`,
	);
	if (!res.ok) throw new Error("Failed to fetch semester structure");
	return res.json();
};


const calculateCredits = (mappings: any[]) => {
    let total = 0;
    let core = 0;
    let electives = 0;
    let genEd = 0;

    mappings.forEach((mapping) => {
        mapping.subjects?.forEach((subject: any) => {
            const credit = Number(subject.credit) || Number(subject.credits) || 0;
            total += credit;
            const name = (subject.subjectName || "").toLowerCase();
            const groupName = (subject.groupName || subject.groupType || "").toLowerCase();
            
            if (name.includes("elective") || groupName.includes("elective")) {
                electives += credit;
            } else if (name.includes("gen ed") || name.includes("general") || groupName.includes("general")) {
                genEd += credit;
            } else {
                core += credit;
            }
        });
    });

    return { total, core, electives, genEd };
};

export default function SemesterStructure({
	curriculumId,
}: {
	curriculumId?: string;
}) {
	const { data: resData, isLoading } = useQuery({
		queryKey: ["semester-mappings", curriculumId],
		queryFn: () => fetchSemesterStructure(curriculumId),
		enabled: !!curriculumId,
	});

	const mappings = resData?.data?.semesterMappings || [];

	// Group semesters by academic year
	// Year 1: sems 1, 2
	// Year 2: sems 3, 4
	// Year 3: sems 5, 6
	// Year 4: sems 7, 8

	const yearNames = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

	const groupedByYear: { [key: number]: any[] } = {};
	mappings.forEach((mapping: any) => {
		const year = Math.ceil(mapping.semesterNo / 2);
		if (!groupedByYear[year]) {
			groupedByYear[year] = [];
		}
		groupedByYear[year].push(mapping);
	});

	const credits = calculateCredits(mappings);
	const yearKeys = Object.keys(groupedByYear)
		.map(Number)
		.sort((a, b) => a - b);

	if (isLoading)
		return (
			<div className="p-20 text-center">Loading semester structure...</div>
		);

	return (
		<div className="grid grid-cols-12 gap-10">
			{/* Content Area: Academic Structure */}
			<div className="col-span-12 xl:col-span-12 space-y-12">
				{yearKeys.length === 0 ? (
					<div className="p-10 text-center text-on-surface-variant italic border rounded-xl bg-surface">
						No semester structure found for this curriculum.
					</div>
				) : (
					yearKeys.map((year) => (
						<section key={year}>
							<div className="flex items-center gap-4 mb-6">
								<div className="h-px flex-1 bg-surface-container-highest"></div>
								<h2 className="text-lg font-bold text-on-surface-variant flex items-center gap-2">
									<span
										className="material-symbols-outlined text-primary"
										style={{ fontVariationSettings: "'FILL' 1" }}
									>
										calendar_month
									</span>
									{yearNames[year - 1] || `Year ${year}`} Academic Year
								</h2>
								<div className="h-px flex-1 bg-surface-container-highest"></div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{groupedByYear[year]
									.sort((a: any, b: any) => a.semesterNo - b.semesterNo)
									.map((semester: any) => (
										<div key={semester.semesterNo} className="space-y-4">
											<h3 className="font-bold text-sm text-on-surface tracking-wide px-2 uppercase">
												Semester {String(semester.semesterNo).padStart(2, "0")}
											</h3>
											<div className="bg-surface-container-low rounded-2xl p-4 space-y-3 min-h-[100px]">
												{semester.subjects?.length > 0 ? (
													semester.subjects.map((subject: any) => (
														<div
															key={subject.subjectId}
															className="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-primary/20"
														>
															<div className="flex justify-between items-start mb-1">
																<span className="text-[10px] font-bold text-primary tracking-widest">
																	{subject.subjectCode}
																</span>
																<span className="text-[10px] font-semibold text-on-surface-variant">
																	{subject.credit} Credits
																</span>
															</div>
															<h4 className="text-sm font-bold text-on-surface">
																{subject.subjectName}
															</h4>
															{subject.prerequisiteSubjectCodes &&
																subject.prerequisiteSubjectCodes.length > 0 && (
																	<div className="mt-2 flex gap-1 flex-wrap">
																		{subject.prerequisiteSubjectCodes.map(
																			(preReq: string) => (
																				<span
																					key={preReq}
																					className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant text-[8px] rounded uppercase font-bold tracking-widest"
																				>
																					PRE: {preReq}
																				</span>
																			),
																		)}
																	</div>
																)}
														</div>
													))
												) : (
													<div className="text-xs text-on-surface-variant italic p-2 text-center">
														No subjects
													</div>
												)}
											</div>
										</div>
									))}
							</div>
						</section>
					))
				)}
			</div>
			{/* Sidebar (Right) */}
			<aside className="col-span-12 xl:col-span-4 space-y-6">
				{/* Curriculum Summary Card */}
				<div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm ring-1 ring-black/[0.03]">
					<h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">
						Curriculum Summary
					</h3>
					<div className="mb-8">
						<span className="text-5xl font-extrabold text-on-surface tracking-tighter">
                                                        {credits.total}
                                                </span>
                                                <span className="text-on-surface-variant font-medium ml-2 uppercase text-xs tracking-widest">
                                                        Total Credits
                                                </span>
					</div>
					<div className="space-y-4 pt-6 border-t border-surface-container">
						<h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
							Credit Distribution
						</h4>
						<div className="space-y-3">
							<div>
								<div className="flex justify-between text-xs font-medium mb-1">
									<span className="text-on-surface">Core Courses</span>
									<span className="text-on-surface-variant">{credits.core} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                                                        style={{ width: `${credits.total > 0 ? (credits.core / credits.total) * 100 : 0}%` }}
                                                                        ></div>
                                                                </div>
                                                        </div>
							<div>
								<div className="flex justify-between text-xs font-medium mb-1">
									<span className="text-on-surface">Electives</span>
									<span className="text-on-surface-variant">{credits.electives} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-secondary rounded-full transition-all duration-500"
                                                                        style={{ width: `${credits.total > 0 ? (credits.electives / credits.total) * 100 : 0}%` }}
                                                                        ></div>
                                                                </div>
                                                        </div>
							<div>
								<div className="flex justify-between text-xs font-medium mb-1">
									<span className="text-on-surface">Gen Ed</span>
									<span className="text-on-surface-variant">{credits.genEd} Credits</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                                                        <div
                                                                        className="h-full bg-on-primary-fixed-variant rounded-full transition-all duration-500"
                                                                        style={{ width: `${credits.total > 0 ? (credits.genEd / credits.total) * 100 : 0}%` }}
                                                                        ></div>
                                                                </div>
                                                        </div>
						</div>
					</div>
				</div>
                        </aside>
                </div>
        );
}
