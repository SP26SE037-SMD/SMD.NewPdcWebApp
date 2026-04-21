"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
	CurriculumService,
	CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { GroupService } from "@/services/group.service";
import { PoService } from "@/services/po.service";
import { PoPloService } from "@/services/poplo.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { RequestService } from "@/services/request.service";
import { Loader2, Calendar } from "lucide-react";

export default function VicePrincipalReviewPage() {
	const { id } = useParams() as { id: string };
	const router = useRouter();
	const queryClient = useQueryClient();

	const [activeTab, setActiveTab] = useState<
		"overview" | "info" | "matrix" | "structure" | "review"
	>("overview");
	
	const [requestId, setRequestId] = useState<string | null>(null);
	const [reviewComment, setReviewComment] = useState("");
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);

	React.useEffect(() => {
		if (typeof window !== "undefined") {
			setRequestId(localStorage.getItem("requestId"));
		}
	}, []);

	// Queries
	const { data: curriculumData, isLoading: isLoadingCur } = useQuery({
		queryKey: ["curriculum-details", id],
		queryFn: () => CurriculumService.getCurriculumById(id),
	});

	const { data: subjectsData, isLoading: isLoadingSub } = useQuery({
		queryKey: ["curriculum-mapped-subjects", id],
		queryFn: () => CurriculumGroupSubjectService.getSubjectsByCurriculum(id),
	});

	const { data: groupData, isLoading: isLoadingGroups } = useQuery({
		queryKey: ["warehouse-groups"],
		queryFn: () => GroupService.getGroups(),
	});

	const { data: plosData, isLoading: isLoadingPLOs } = useQuery({
		queryKey: ["curriculum-plos", id],
		queryFn: () => CurriculumService.getPLOsByCurriculumId(id),
		enabled: !!id,
	});

	const { data: mappingsData, isLoading: isLoadingMappings } = useQuery({
		queryKey: ["po-plo-mappings", id],
		queryFn: () => PoPloService.getMappingsByCurriculum(id),
		enabled: !!id,
	});

	const majorId =
		curriculumData?.data?.majorId || curriculumData?.data?.major?.majorId;
	const { data: posData, isLoading: isLoadingPOs } = useQuery({
		queryKey: ["pos-major", majorId],
		queryFn: () => PoService.getPOsByMajorId(majorId || ""),
		enabled: !!majorId,
	});

	const mutation = useMutation({
		mutationFn: async (newStatus: string) => {
			const curRes = await CurriculumService.updateCurriculumStatus(
				id,
				newStatus as any,
			);
			if (newStatus === CURRICULUM_STATUS.STRUCTURE_APPROVED) {
				await SubjectService.updateSubjectStatusesBulk(
					id,
					SUBJECT_STATUS.DEFINED,
					undefined,
					SUBJECT_STATUS.DRAFT,
				);
				await CurriculumService.updatePloStatusByCurriculum(
					id,
					"INTERNAL_REVIEW",
				);
			}
			return curRes;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["curriculum-details", id] });
			router.push(`/dashboard/vice-principal/digital-enactment`);
		},
	});

	const curriculum = curriculumData?.data;
	const mappings = subjectsData?.data?.semesterMappings || [];
	const plos =
		plosData?.data?.content ||
		plosData?.data ||
		(Array.isArray(plosData) ? plosData : []);
	const pos = (posData?.data as any)?.content || posData?.data || [];
	const poPloMappings = mappingsData?.data || [];

	const stats = useMemo(() => {
		let count = 0;
		let credits = 0;
		mappings.forEach((m: any) => {
			m.subjects?.forEach((s: any) => {
				count++;
				credits += s.credit ?? s.credits ?? 3;
			});
		});
		return {
			totalSubjects: count,
			totalCredits: credits,
			semesterCount: mappings.length,
		};
	}, [mappings]);

	const isMapped = (poId: string, ploId: string) => {
		return poPloMappings.some(
			(m: any) =>
				(m.poId === poId || m.po?.poId === poId) &&
				(m.ploId === ploId || m.plo?.ploId === ploId),
		);
	};

	if (
		isLoadingCur ||
		isLoadingSub ||
		isLoadingGroups ||
		isLoadingPLOs ||
		isLoadingPOs ||
		isLoadingMappings
	) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#f8f9fa]">
				<Loader2 className="animate-spin text-[#2d6a4f]" size={40} />
				<p className="mt-4 text-[12px] font-black uppercase tracking-widest text-[#5a6062]">
					Loading Governance Matrix...
				</p>
			</div>
		);
	}

	const handleApprove = async () => {
		if (
			confirm(
				"Approve this curriculum structure? This will allow HoCFDC to proceed with syllabus development.",
			)
		) {
			setIsSubmittingReview(true);
			try {
				if (requestId) {
					await RequestService.updateRequest(requestId, {
						status: "APPROVED",
						comment: reviewComment,
					});
				}
				mutation.mutate(CURRICULUM_STATUS.STRUCTURE_APPROVED);
			} catch (e) {
				console.error(e);
				alert("Failed to approve request.");
			} finally {
				setIsSubmittingReview(false);
			}
		}
	};
	
	const handleReject = async () => {
		if (!reviewComment.trim()) {
			alert("Please provide a comment for requesting revision (rejection).");
			return;
		}
		if (
			confirm(
				"Are you sure you want to request a revision for this curriculum? It will be marked as REJECTED.",
			)
		) {
			setIsSubmittingReview(true);
			try {
				if (requestId) {
					await RequestService.updateRequest(requestId, {
						status: "REJECTED",
						comment: reviewComment,
					});
				} else {
					alert("No active request ID found. Cannot reject.");
					return;
				}
				alert("Request rejected successfully!");
				router.push(`/dashboard/vice-principal/digital-enactment`);
			} catch (e) {
				console.error(e);
				alert("Failed to reject request.");
			} finally {
				setIsSubmittingReview(false);
			}
		}
	};

	return (
		<div
			className="max-w-7xl mx-auto px-8 py-10 bg-[#f8f9fa] text-[#2d3335] min-h-[calc(100vh-4rem)]"
			style={{ fontFamily: "Inter, sans-serif" }}
		>
			{/* Header */}
			<div className="mb-10 ml-4">
				<nav className="flex items-center gap-2 text-xs text-[#5a6062] mb-4 font-medium uppercase tracking-widest">
					<span
						className="cursor-pointer hover:underline"
						onClick={() => router.back()}
					>
						Curriculum Proposals
					</span>
					<span className="material-symbols-outlined text-[10px]">
						chevron_right
					</span>
					<span className="text-[#2d6a4f]">
						{curriculum?.curriculumCode || "Loading..."}
					</span>
				</nav>
				<h1
					className="text-5xl font-extrabold tracking-tighter text-[#2d3335] mb-4"
					style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
				>
					{curriculum?.major?.majorName ||
						curriculum?.curriculumName ||
						"Computer Science"}
				</h1>

			</div>

			{/* Sub-navigation Tabs */}
			<div className="flex gap-12 mb-8 border-b-0 relative ml-4">
				<button
					onClick={() => setActiveTab("overview")}
					className={`pb-4 font-semibold transition-colors relative ${activeTab === "overview" ? "text-[#2d6a4f] font-bold" : "text-[#5a6062] hover:text-[#2d6a4f]"}`}
				>
					Major Overview
					{activeTab === "overview" && (
						<div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
					)}
				</button>
				<button
					onClick={() => setActiveTab("info")}
					className={`pb-4 font-semibold transition-colors relative ${activeTab === "info" ? "text-[#2d6a4f] font-bold" : "text-[#5a6062] hover:text-[#2d6a4f]"}`}
				>
					Curriculum Info
					{activeTab === "info" && (
						<div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
					)}
				</button>
				<button
					onClick={() => setActiveTab("matrix")}
					className={`pb-4 font-semibold transition-colors relative ${activeTab === "matrix" ? "text-[#2d6a4f] font-bold" : "text-[#5a6062] hover:text-[#2d6a4f]"}`}
				>
					Mapping Matrix
					{activeTab === "matrix" && (
						<div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
					)}
				</button>
				<button
					onClick={() => setActiveTab("structure")}
					className={`pb-4 font-semibold transition-colors relative ${activeTab === "structure" ? "text-[#2d6a4f] font-bold" : "text-[#5a6062] hover:text-[#2d6a4f]"}`}
				>
					Semester Structure
					{activeTab === "structure" && (
						<div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
					)}
				</button>
				<button
					onClick={() => setActiveTab("review")}
					className={`pb-4 font-semibold transition-colors relative ${activeTab === "review" ? "text-[#2d6a4f] font-bold" : "text-[#5a6062] hover:text-[#2d6a4f]"}`}
				>
					Review Request
					{activeTab === "review" && (
						<div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d6a4f] rounded-full"></div>
					)}
				</button>
			</div>

			{/* Tab Content */}
			<div className="ml-4">
				{activeTab === "overview" && (
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
						<div className="lg:col-span-12 flex flex-col gap-8">
							{/* Core Description inherited from before */}
							<section className="bg-[#ffffff] rounded-2xl p-8 shadow-[0px_4px_20px_rgba(45,51,53,0.04),_0px_2px_8px_rgba(45,51,53,0.08)]">
								<h3
									className="text-xl font-bold mb-6 text-[#1d5c42] flex items-center gap-2"
									style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
								>
									<span className="material-symbols-outlined">info</span>
									Core Specifications
								</h3>
								<p className="text-[#5a6062] leading-relaxed text-lg font-light italic mb-8">
									"
									{curriculum?.description ||
										`Detailed specification and governance matrix.`}
									"
								</p>
								<div className="space-y-6">
									<div className="group">
										<label className="text-xs font-bold text-[#5a6062] uppercase tracking-widest block mb-1">
											Academic Department
										</label>
										<p className="text-lg font-medium text-[#2d3335]">
											{curriculum?.major?.majorName ||
												curriculum?.curriculumName ||
												"N/A"}
										</p>
									</div>
									<div className="group border-t border-[#dee3e6] pt-4">
										<label className="text-xs font-bold text-[#5a6062] uppercase tracking-widest block mb-1">
											Total Credits
										</label>
										<p className="text-lg font-medium text-[#2d3335]">
											{stats.totalCredits} Units
										</p>
									</div>
									<div className="group border-t border-[#dee3e6] pt-4">
										<label className="text-xs font-bold text-[#5a6062] uppercase tracking-widest block mb-1">
											Total Semesters
										</label>
										<p className="text-lg font-medium text-[#2d3335]">
											{stats.semesterCount} Semesters
										</p>
									</div>
								</div>
							</section>
						</div>
					</div>
				)}

				{activeTab === "info" && (
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
						<div className="lg:col-span-12 flex flex-col gap-8">
							{/* Curriculum Basic Information */}
							<section className="bg-[#ffffff] rounded-2xl p-8 shadow-[0px_4px_20px_rgba(45,51,53,0.04),_0px_2px_8px_rgba(45,51,53,0.08)]">
								<h3
									className="text-xl font-bold mb-6 text-[#1d5c42] flex items-center gap-2"
									style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
								>
									<span className="material-symbols-outlined">library_books</span>
									General Information
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
									<div className="p-5 bg-[#f1f4f5] rounded-xl border border-[#dee3e6] shadow-sm">
										<p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-widest mb-1">Curriculum Code</p>
										<p className="text-[#2d3335] font-black">{curriculum?.curriculumCode || "N/A"}</p>
									</div>
									<div className="p-5 bg-[#f1f4f5] rounded-xl border border-[#dee3e6] shadow-sm">
										<p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-widest mb-1">Curriculum Name</p>
										<p className="text-[#2d3335] font-black">{curriculum?.curriculumName || "N/A"}</p>
									</div>
									<div className="p-5 bg-[#f1f4f5] rounded-xl border border-[#dee3e6] shadow-sm">
										<p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-widest mb-1">Major Specialization</p>
										<p className="text-[#2d3335] font-black">{curriculum?.major?.majorName || curriculum?.major?.majorCode || "N/A"}</p>
									</div>
									<div className="p-5 bg-[#b1f0ce]/30 rounded-xl border border-[#2d6a4f]/20 shadow-sm">
										<p className="text-[10px] font-bold text-[#2d6a4f] uppercase tracking-widest mb-1">Timeline Enactment</p>
										<p className="text-[#1d5c42] font-black">
											{curriculum?.startYear ? `${curriculum.startYear} - ${curriculum.endYear}` : "Pending"}
										</p>
									</div>
								</div>
							</section>

							<section className="bg-[#f1f4f5] p-1 rounded-xl">
								<div className="bg-[#ffffff] p-8 rounded-lg shadow-[0px_4px_20px_rgba(45,51,53,0.04),_0px_2px_8px_rgba(45,51,53,0.08)] h-full">
									<div className="flex justify-between items-center mb-8">
										<h3
											className="text-2xl font-bold tracking-tight text-[#1d5c42]"
											style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
										>
											Program Learning Outcomes
										</h3>
										<span className="text-xs font-semibold text-[#5a6062] bg-[#dee3e6] px-3 py-1 rounded-full">
											{plos?.length || 0} PLOs
										</span>
									</div>
									<div className="space-y-8 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
										{plos && plos.length > 0 ? (
											plos.map((plo: any, idx: number) => (
												<div
													key={plo.ploId || idx}
													className="flex gap-6 group"
												>
													<div className="flex-shrink-0 w-12 h-12 bg-[#b1f0ce] rounded-xl flex items-center justify-center text-[#1d5c42] font-black text-lg">
														{idx + 1}
													</div>
													<div>
														<h4 className="font-bold text-[#2d3335] mb-2 leading-snug">
															{plo.ploCode ||
																plo.ploName ||
																`Outcome ${idx + 1}`}
														</h4>
														<p className="text-[#5a6062] text-sm leading-relaxed">
															{plo.description}
														</p>
													</div>
												</div>
											))
										) : (
											<div className="text-center py-8 text-[#5a6062]">
												No PLOs mapped currently.
											</div>
										)}
									</div>
								</div>
							</section>
						</div>
					</div>
				)}

				{activeTab === "matrix" && (
					<div className="space-y-8">
						<section className="flex flex-col lg:flex-row gap-8">
							<div className="flex-1">
								<h2
									className="text-4xl font-black text-[#2d3335] tracking-tight mb-3"
									style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
								>
									PO to PLO Matrix
								</h2>
							</div>
						</section>

						<div className="bg-[#ffffff] rounded-2xl shadow-sm border border-[#dee3e6] overflow-hidden">
							<div className="overflow-x-auto no-scrollbar">
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="bg-[#f1f4f5]/50">
											<th
												className="p-6 border-b border-[#dee3e6] text-sm font-bold text-[#5a6062] uppercase tracking-wider w-1/3 min-w-[300px]"
												style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
											>
												Program Objectives (PO)
											</th>
											{plos.map((plo: any, i: number) => (
												<th
													key={plo.ploId || i}
													className="p-4 border-b border-[#dee3e6] text-[11px] font-bold text-[#5a6062] uppercase tracking-widest text-center min-w-[120px] cursor-help relative group"
													style={{
														fontFamily: "Plus Jakarta Sans, sans-serif",
													}}
												>
													{plo.ploCode || plo.ploName || `Outcome ${i + 1}`}
													{/* Custom Tooltip */}
													<div className={`absolute top-full mt-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#2d3335] text-[11px] font-medium rounded-xl p-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#dee3e6] pointer-events-none z-[100] normal-case tracking-normal text-left ${i > plos.length - 3 ? 'right-0' : 'left-0'}`}>
														{plo.description || plo.ploName || 'No description available.'}
													</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-[#dee3e6]/50">
										{pos.map((po: any, poIndex: number) => (
											<tr
												key={po.poId}
												className="hover:bg-[#f1f4f5]/50 transition-colors"
											>
												<td className="p-6 relative group">
													<div className="flex flex-col items-center">
														<span className="text-sm font-bold text-[#2d6a4f] cursor-help hover:underline">{po.poCode || po.poName || 'Unknown PO'}</span>
													</div>
													{/* Custom Tooltip */}
													<div className={`absolute left-full ml-4 w-72 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#2d3335] text-[12px] font-medium rounded-xl p-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#dee3e6] pointer-events-none z-[100] text-left ${poIndex > pos.length - 3 ? 'bottom-[10%]' : 'top-[30%]'}`}>
														{po.description || po.poName || 'No description available.'}
													</div>
												</td>
												{plos.map((plo: any) => {
													const mapped = isMapped(po.poId, plo.ploId);
													return (
														<td key={plo.ploId} className="p-4 text-center">
															<div className="flex justify-center">
																{mapped ? (
																	<div className="w-8 h-8 rounded-lg bg-[#b1f0ce] text-[#1d5c42] flex items-center justify-center">
																		<span
																			className="material-symbols-outlined text-lg"
																			style={{
																				fontVariationSettings: "'wght' 700",
																			}}
																		>
																			check
																		</span>
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
										{pos.length === 0 && (
											<tr>
												<td
													colSpan={plos.length + 1}
													className="p-6 text-center text-[#5a6062]"
												>
													No mapping data available
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{activeTab === "structure" && (
					<div className="space-y-12 max-w-5xl">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{mappings.map((semesterData: any, i: number) => (
								<div
									key={`sem-${semesterData.semester || semesterData.semesterNo || "undef"}-${i}`}
									className="space-y-4"
								>
									<h3 className="font-bold text-sm text-[#2d3335] tracking-wide px-2 uppercase">
										{semesterData.semester || semesterData.semesterNo
											? `Semester ${String(semesterData.semester || semesterData.semesterNo).padStart(2, "0")}`
											: "Semester Unassigned"}
									</h3>
									<div className="bg-[#f1f4f5] rounded-2xl p-4 space-y-3 min-h-[150px]">
										{semesterData.subjects &&
										semesterData.subjects.length > 0 ? (
											semesterData.subjects.map((sub: any) => (
												<div
													key={sub.subjectId || sub.subjectCode}
													className={`bg-[#ffffff] p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${sub.status === "DRAFT" ? "border-l-4 border-yellow-400" : "border-l-4 border-[#2d6a4f]/20"}`}
												>
													<div className="flex justify-between items-start mb-1">
														<span className="text-[10px] font-bold text-[#2d6a4f] tracking-widest">
															{sub.subjectCode}
														</span>
														<span className="text-[10px] font-semibold text-[#5a6062] bg-[#f1f4f5] px-2 py-0.5 rounded">
															{sub.credit || sub.credits || 3} Credits
														</span>
													</div>
													<h4 className="text-sm font-bold text-[#2d3335] leading-tight">
														{sub.subjectName || sub.translatedName}
													</h4>
													{sub.prerequisites &&
														sub.prerequisites.length > 0 && (
															<p className="text-[10px] text-[#5a6062] mt-2 italic flex items-center gap-1">
																<span className="material-symbols-outlined text-[10px]">
																	link
																</span>
																Prereq:{" "}
																{sub.prerequisites
																	.map((p: any) => p.subjectCode)
																	.join(", ")}
															</p>
														)}
												</div>
											))
										) : (
											<div className="p-4 text-center text-sm text-[#5a6062] italic flex items-center justify-center h-full gap-2">
												<span className="material-symbols-outlined text-xl opacity-50">
													data_alert
												</span>
												No subjects mapped
											</div>
										)}
									</div>
								</div>
							))}
						</div>
						{mappings.length === 0 && (
							<div className="text-center py-12 text-[#5a6062] bg-[#f1f4f5] rounded-xl flex items-center justify-center flex-col gap-2">
								<span className="material-symbols-outlined text-4xl">
									account_tree
								</span>
								<p>Semester structure has not been built yet.</p>
							</div>
						)}
					</div>
				)}

				{activeTab === "review" && (
					<div className="max-w-4xl mx-auto pt-0 pb-6">
						<div className="bg-[#ffffff] p-6 md:p-8 rounded-3xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] border border-[#dee3e6]">
							<div className="mb-6 pb-4 border-b border-[#dee3e6]">
								<h2 className="text-2xl font-bold tracking-tight text-[#2d3335]" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
									Final Curriculum Review
								</h2>
								<p className="text-sm text-[#5a6062] mt-2 max-w-2xl leading-relaxed">
									Please provide your official feedback below. This comment will be attached to the request response. Once ready, choose to either request a revision (reject) or officially approve the structure.
								</p>
							</div>

							<div className="mb-6">
								<h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-wider mb-4 flex items-center gap-2">
									<span className="material-symbols-outlined text-[20px] text-[#2d6a4f]">
										history_edu
									</span>
									Official Feedback
								</h3>
								<div className="relative group">
									<textarea
										value={reviewComment}
										onChange={(e) => setReviewComment(e.target.value)}
										className="w-full h-32 bg-[#f1f4f5] border-2 border-transparent group-hover:border-[#2d6a4f]/30 rounded-2xl p-6 text-sm focus:bg-white focus:border-[#2d6a4f] transition-all resize-none shadow-inner outline-none"
										placeholder="Add detailed feedback, required changes, or general notes for the faculty..."
									></textarea>
								</div>
								<div className="mt-3 flex items-center gap-2 px-2 opacity-80">
									<span className="material-symbols-outlined text-[#5a6062] text-[16px]">
										info
									</span>
									<p className="text-xs text-[#5a6062] font-medium">
										Comment is required for requesting a revision (reject).
									</p>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
								<button 
									onClick={handleReject}
									disabled={isSubmittingReview || mutation.isPending}
									className="w-full sm:w-1/2 py-4 bg-white border-2 border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:border-rose-500 hover:text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
								>
									{isSubmittingReview ? <Loader2 size={20} className="animate-spin" /> : (
										<span className="material-symbols-outlined text-[20px]">
											assignment_return
										</span>
									)}
									Request Revision
								</button>
								<button 
									onClick={handleApprove}
									disabled={isSubmittingReview || mutation.isPending}
									className="w-full sm:w-1/2 py-4 bg-[#2d6a4f] text-white border-2 border-[#2d6a4f] hover:bg-[#1d5c42] hover:border-[#1d5c42] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#2d6a4f]/25 transition-all duration-300 disabled:opacity-50"
								>
									{isSubmittingReview || mutation.isPending ? <Loader2 size={20} className="animate-spin" /> : (
										<span className="material-symbols-outlined text-[20px]">
											task_alt
										</span>
									)}
									Approve Structure
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
