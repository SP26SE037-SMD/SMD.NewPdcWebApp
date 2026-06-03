"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CurriculumService,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { GroupService } from "@/services/group.service";
import { PoService } from "@/services/po.service";
import { PoPloService } from "@/services/poplo.service";
import { Loader2, X, FileText, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://blydhlkiaqmgdhnueqad.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWRobGtpYXFtZ2RobnVlcWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Mjk2ODMsImV4cCI6MjA5MzEwNTY4M30.oeBAhVfqlHLOC8wgbKE1yL3AW_y835IgBEd9nPJaiuI";
const SUPABASE_BUCKET = "academic-docs";

// Helper function to remove Vietnamese tones and make string URL-safe
const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\s+/g, "-");
  str = str.replace(/[^a-zA-Z0-9.\-_]/g, "");
  return str;
};


export default function VicePrincipalReviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "overview" | "info" | "matrix" | "structure"
  >("overview");

  const searchParams = useSearchParams();
  const majorIdFromUrl = searchParams.get("majorId");
  const curIdFromUrl = searchParams.get("curriculumId");

  const effectiveId = id || curIdFromUrl || "";
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Decision Document Upload & Preview States
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionFile, setDecisionFile] = useState<File | null>(null);
  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionPreviewUrl, setDecisionPreviewUrl] = useState<string | null>(null);
  const [uploadingDecision, setUploadingDecision] = useState(false);
  const decisionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (decisionPreviewUrl) {
        URL.revokeObjectURL(decisionPreviewUrl);
      }
    };
  }, [decisionPreviewUrl]);

  // Queries
  const { data: curriculumData, isLoading: isLoadingCur } = useQuery({
    queryKey: ["curriculum-details", effectiveId],
    queryFn: () => CurriculumService.getCurriculumById(effectiveId),
    enabled: !!effectiveId,
  });

  const { data: subjectsData, isLoading: isLoadingSub } = useQuery({
    queryKey: ["curriculum-mapped-subjects", effectiveId],
    queryFn: () =>
      CurriculumGroupSubjectService.getSubjectsByCurriculum(effectiveId),
    enabled: !!effectiveId,
  });

  const { data: groupData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["warehouse-groups"],
    queryFn: () => GroupService.getGroups(),
  });

  const { data: plosData, isLoading: isLoadingPLOs } = useQuery({
    queryKey: ["curriculum-plos", effectiveId],
    queryFn: () => CurriculumService.getPLOsByCurriculumId(effectiveId),
    enabled: !!effectiveId,
  });

  const { data: mappingsData, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["po-plo-mappings", effectiveId],
    queryFn: () => PoPloService.getMappingsByCurriculum(effectiveId),
    enabled: !!effectiveId,
  });

  const majorId =
    curriculumData?.data?.majorId ||
    curriculumData?.data?.major?.majorId ||
    curriculumData?.majorId ||
    curriculumData?.major?.majorId ||
    majorIdFromUrl;

  const { data: posData, isLoading: isLoadingPOs } = useQuery({
    queryKey: ["pos-major", majorId],
    queryFn: () => PoService.getPOsByMajorId(majorId || ""),
    enabled: !!majorId,
  });



  const curriculum = curriculumData?.data || curriculumData;
  const mappings =
    (subjectsData as any)?.data?.semesterMappings ||
    (subjectsData as any)?.semesterMappings ||
    [];
  const plos =
    plosData?.data?.content ||
    plosData?.data ||
    (Array.isArray(plosData) ? plosData : []);
  const pos = (posData?.data as any)?.content || posData?.data || [];
  const poPloMappings = mappingsData?.data || mappingsData || [];

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
    return (poPloMappings as any[]).some(
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

  const handlePublish = () => {
    setDecisionTitle(`QD-${curriculum?.curriculumCode || ""}`);
    setIsDecisionModalOpen(true);
  };

  const handleDecisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        showToast("Only PDF files are allowed", "error");
        return;
      }
      setDecisionFile(selectedFile);

      if (decisionPreviewUrl) {
        URL.revokeObjectURL(decisionPreviewUrl);
      }
      const url = URL.createObjectURL(selectedFile);
      setDecisionPreviewUrl(url);

      if (!decisionTitle) {
        setDecisionTitle(`QD-${curriculum?.curriculumCode || ""}`);
      }
    }
  };

  const resetDecisionModal = () => {
    setIsDecisionModalOpen(false);
    setDecisionFile(null);
    setDecisionTitle("");
    if (decisionPreviewUrl) {
      URL.revokeObjectURL(decisionPreviewUrl);
    }
    setDecisionPreviewUrl(null);
    setUploadingDecision(false);
  };

  const handleConfirmPublish = async () => {
    if (!decisionFile || !decisionTitle.trim()) {
      showToast("Please provide both a PDF file and a decision number/title", "error");
      return;
    }

    setUploadingDecision(true);
    try {
      // 1. Upload to Supabase Storage
      const cleanTitle = removeVietnameseTones(decisionTitle.trim());
      const cleanName = `${cleanTitle}.pdf`;
      const filePath = encodeURIComponent(cleanName);
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filePath}`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/pdf",
          "x-upsert": "true",
        },
        body: decisionFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload decision document to storage.");
      }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;

      // 2. Call backend API to create a new document record
      const docResponse = await fetch("/api/document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentUrl: publicUrl,
          description: decisionTitle.trim(),
          majorId: curriculum?.majorId || curriculum?.major?.majorId || null,
        }),
      });

      if (!docResponse.ok) {
        const errData = await docResponse.json().catch(() => ({}));
        console.error("Backend API Error:", errData);
        throw new Error(
          errData.message || "Failed to save document record in the system."
        );
      }

      // 3. Patch decision update to curriculum subjects
      try {
        await CurriculumService.updateCurriculumDecision(effectiveId, decisionTitle.trim());
      } catch (patchError: any) {
        console.error("Failed to patch decisionNo to curriculum subjects:", patchError);
        throw new Error(patchError?.message || "Failed to update decision number across curriculum subjects.");
      }

      // 4. Update curriculum status to PUBLISHED
      try {
        await CurriculumService.updateCurriculumStatus(effectiveId, "PUBLISHED");
      } catch (statusError: any) {
        console.error("Failed to update curriculum status to PUBLISHED:", statusError);
        throw new Error(statusError?.message || "Failed to finalize publishing status.");
      }

      showToast("Curriculum published and decision updated successfully!", "success");
      resetDecisionModal();
      queryClient.invalidateQueries({ queryKey: ["curriculum-details", effectiveId] });
      router.refresh();
    } catch (error: any) {
      console.error("Publishing flow error:", error);
      showToast(error.message || "An unexpected error occurred during publishing.", "error");
    } finally {
      setUploadingDecision(false);
    }
  };


  const handleExportPDF = async () => {
    setIsExporting(true);
    showToast("Preparing your PDF download...", "success");
    try {
      const response = await fetch(`/api/curricula/${effectiveId}/export-pdf`);
      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `curriculum-${curriculum?.curriculumCode || effectiveId}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("PDF downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Failed to export PDF:", error);
      showToast("Failed to export curriculum to PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="max-w-7xl mx-auto px-8 py-10 bg-[#f8f9fa] text-[#2d3335] min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-10 ml-4 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-[#dee3e6] pb-8">
        <div>
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
          <div className="flex items-center gap-4 flex-wrap">
            <h1
              className="text-5xl font-extrabold tracking-tighter text-[#2d3335]"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {curriculum?.major?.majorName ||
                curriculum?.curriculumName ||
                "Computer Science"}
            </h1>
            {curriculum?.status && (
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                curriculum.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : curriculum.status === "FINAL_REVIEW"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}>
                {curriculum.status.replace("_", " ")}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-5 py-3 bg-white border border-[#dee3e6] hover:bg-[#f1f4f5] text-[#2d3335] rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin text-[#2d6a4f]" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">download</span>
            )}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
          
          {curriculum?.status !== "PUBLISHED" ? (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-3 bg-[#2d6a4f] text-white hover:bg-[#1d5c42] rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isPublishing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">publish</span>
              )}
              Publish
            </button>
          ) : (
            <div className="px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Published
            </div>
          )}
        </div>
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
                  <span className="material-symbols-outlined">
                    library_books
                  </span>
                  General Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 bg-[#f1f4f5] rounded-xl border border-[#dee3e6] shadow-sm">
                    <p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-widest mb-1">
                      Curriculum Code
                    </p>
                    <p className="text-[#2d3335] font-black">
                      {curriculum?.curriculumCode || "N/A"}
                    </p>
                  </div>
                  <div className="p-5 bg-[#f1f4f5] rounded-xl border border-[#dee3e6] shadow-sm">
                    <p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-widest mb-1">
                      Curriculum Name
                    </p>
                    <p className="text-[#2d3335] font-black">
                      {curriculum?.curriculumName || "N/A"}
                    </p>
                  </div>
                  <div className="p-5 bg-[#f1f4f5] rounded-xl border border-[#dee3e6] shadow-sm">
                    <p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-widest mb-1">
                      Major Specialization
                    </p>
                    <p className="text-[#2d3335] font-black">
                      {curriculum?.major?.majorName ||
                        curriculum?.major?.majorCode ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="p-5 bg-[#b1f0ce]/30 rounded-xl border border-[#2d6a4f]/20 shadow-sm">
                    <p className="text-[10px] font-bold text-[#2d6a4f] uppercase tracking-widest mb-1">
                      Timeline Enactment
                    </p>
                    <p className="text-[#1d5c42] font-black">
                      {curriculum?.startYear
                        ? `${curriculum.startYear} - ${curriculum.endYear}`
                        : "Pending"}
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
                          <div
                            className={`absolute top-full mt-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#2d3335] text-[11px] font-medium rounded-xl p-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#dee3e6] pointer-events-none z-[100] normal-case tracking-normal text-left ${i > plos.length - 3 ? "right-0" : "left-0"}`}
                          >
                            {plo.description ||
                              plo.ploName ||
                              "No description available."}
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
                            <span className="text-sm font-bold text-[#2d6a4f] cursor-help hover:underline">
                              {po.poCode || po.poName || "Unknown PO"}
                            </span>
                          </div>
                          {/* Custom Tooltip */}
                          <div
                            className={`absolute left-full ml-4 w-72 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#2d3335] text-[12px] font-medium rounded-xl p-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#dee3e6] pointer-events-none z-[100] text-left ${poIndex > pos.length - 3 ? "bottom-[10%]" : "top-[30%]"}`}
                          >
                            {po.description ||
                              po.poName ||
                              "No description available."}
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
      </div>

      {/* Upload Decision Modal */}
      <AnimatePresence>
        {isDecisionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={uploadingDecision ? undefined : resetDecisionModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Upload size={20} className="text-[#2d6a4f]" />
                  Upload Enactment Decision PDF
                </h2>
                <button
                  disabled={uploadingDecision}
                  onClick={resetDecisionModal}
                  className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: PDF Preview */}
                <div className="hidden lg:block w-3/5 bg-zinc-100/50 relative border-r border-zinc-200">
                  {decisionPreviewUrl ? (
                    <div className="absolute inset-0 p-6">
                      <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden relative">
                        <iframe
                          src={decisionPreviewUrl}
                          className="w-full h-full border-none"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 p-12 text-center">
                      <div className="w-40 h-52 border-4 border-dashed border-zinc-200 rounded-3xl flex items-center justify-center mb-6">
                        <FileText size={80} className="opacity-10" />
                      </div>
                      <p className="text-base font-black opacity-30 uppercase tracking-[0.2em]">
                        Preview Engine Ready
                      </p>
                      <p className="text-sm mt-3 opacity-30 font-medium">
                        Please select a decision PDF file on the right to preview
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Panel: Form Inputs */}
                <div className="w-full lg:w-2/5 p-10 overflow-y-auto bg-zinc-50/30">
                  <div className="space-y-10 max-w-lg mx-auto">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                        Publish Curriculum
                      </h3>
                      <p className="text-zinc-500 text-sm font-medium">
                        Please upload the official enactment decision PDF document and set its title/number. This will be synchronized as the decision number across all subjects in the curriculum.
                      </p>
                    </div>

                    {/* Decision No / Title Input */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        Decision No. / Document Title
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={uploadingDecision}
                          placeholder="e.g. QD-CNTT-2026-001"
                          value={decisionTitle}
                          onChange={(e) => setDecisionTitle(e.target.value)}
                          className="w-full p-5 pl-14 bg-white border border-zinc-200 rounded-2xl focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/10 outline-none transition-all font-bold shadow-sm placeholder:text-zinc-300 disabled:opacity-50"
                        />
                        <FileText
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"
                          size={24}
                        />
                      </div>
                    </div>

                    {/* File Upload Dropzone */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        PDF Enactment Decision
                      </label>
                      <div
                        onClick={() => !uploadingDecision && decisionFileInputRef.current?.click()}
                        className={`border-2 border-dashed border-zinc-200 rounded-[2rem] p-12 text-center transition-all cursor-pointer group bg-white shadow-sm hover:shadow-xl hover:shadow-[#2d6a4f]/5 ${uploadingDecision ? "opacity-50 cursor-not-allowed" : "hover:border-[#2d6a4f] hover:bg-[#2d6a4f]/5"}`}
                      >
                        <input
                          type="file"
                          ref={decisionFileInputRef}
                          disabled={uploadingDecision}
                          onChange={handleDecisionFileChange}
                          className="hidden"
                          accept=".pdf"
                        />
                        {decisionFile ? (
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mb-5 rotate-6 group-hover:rotate-0 transition-transform shadow-inner">
                              <CheckCircle2 size={40} />
                            </div>
                            <p className="font-black text-zinc-900 mb-2 max-w-xs truncate">
                              {decisionFile.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-white bg-[#2d6a4f] px-3 py-1 rounded-full uppercase">
                                Ready
                              </span>
                              <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full uppercase">
                                {(decisionFile.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-400 mb-5 group-hover:text-[#2d6a4f] group-hover:bg-[#2d6a4f]/10 transition-all shadow-inner">
                              <Upload size={40} />
                            </div>
                            <p className="font-black text-zinc-900">
                              Drop decision PDF here
                            </p>
                            <p className="text-xs text-zinc-400 mt-2 font-medium">
                              Click to browse files
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
                <button
                  disabled={uploadingDecision}
                  onClick={resetDecisionModal}
                  className="px-6 py-3 font-bold text-sm text-zinc-500 hover:text-zinc-700 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!decisionFile || !decisionTitle.trim() || uploadingDecision}
                  onClick={handleConfirmPublish}
                  className="px-8 py-3 bg-[#2d6a4f] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#2d6a4f]/20 hover:bg-[#1d5c42] transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  {uploadingDecision ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Confirm & Publish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
