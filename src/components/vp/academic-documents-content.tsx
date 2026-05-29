"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
  X,
  FileDown,
  Clock,
  Folder,
  ChevronDown,
  Plus,
  Send,
  Calendar,
  AlertCircle,
  FileSearch,
  SearchCheck,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  FileBox,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { clearAiProcessingMessage } from "@/store/slices/notificationSlice";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";
import { MajorService, Major } from "@/services/major.service";
import { DocumentService, DocumentDetail } from "@/services/document.service";

// Helper to get cookie value in client-side (used if needed for direct calls)
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// --- SUB-COMPONENTS ---
const Timer = ({ startTime }: { startTime?: number }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return m > 0 ? `${m}m${s}s` : `${s}s`;
  };

  return (
    <span className="inline-block ml-1 opacity-80">
      ({formatTime(elapsed)})
    </span>
  );
};

const FAKE_VAL_TASKS = [
  "Analyzing PDF Structure",
  "Locating Table of Contents",
  "Checking Major Identity Section",
  "Verifying Program Objectives (POs)",
  "Scanning Program Learning Outcomes (PLOs)",
  "Validating Curriculum Mapping Tables",
  "Checking Course Credit Distribution",
  "Finalizing Document Compliance Report",
];

const ValidationProgress = ({ startTime }: { startTime?: number }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const updateIndex = () => {
      const elapsedMs = Date.now() - startTime;
      const index = Math.floor(elapsedMs / 6000); // 6s per task
      setCurrentIndex(Math.min(index, FAKE_VAL_TASKS.length - 1));
    };
    updateIndex();
    const interval = setInterval(updateIndex, 2000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="mt-6 text-left w-full bg-zinc-50 rounded-2xl p-6 border border-zinc-200/50 shadow-inner max-h-[220px] overflow-hidden relative">
      <div className="space-y-3">
        {FAKE_VAL_TASKS.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: i <= currentIndex ? 1 : 0.3,
              x: 0,
              color:
                i === currentIndex
                  ? "#1d5c42"
                  : i < currentIndex
                    ? "#5a6062"
                    : "#9ca3af",
            }}
            className="flex items-center gap-3 text-xs font-bold"
          >
            {i < currentIndex ? (
              <CheckCircle2 size={14} className="text-emerald-500" />
            ) : i === currentIndex ? (
              <Loader2 size={14} className="animate-spin text-[#1d5c42]" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200" />
            )}
            <span
              className={
                i === currentIndex ? "scale-105 transition-transform" : ""
              }
            >
              {task}
            </span>
          </motion.div>
        )).slice(Math.max(0, currentIndex - 4), currentIndex + 2)}
      </div>
    </div>
  );
};

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

 

export default function AcademicDocumentsContent() {
  const [activeTab, setActiveTab] = useState<"pending" | "organized">(
    "pending",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API State
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);

  // Organized by Major State
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [majorDocs, setMajorDocs] = useState<DocumentDetail[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Upload & Validation State
  const [file, setFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("Programme Proposal of ");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<
    "idle" | "validating" | "success" | "error"
  >("idle");
  const [validationStartTime, setValidationStartTime] = useState<
    number | undefined
  >(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Assign Task State
  const [assignModalDoc, setAssignModalDoc] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    taskName: "Extract Major from Document",
    description: "",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    priority: "HIGH",
  });

  const dispatch = useDispatch();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { aiProcessingMessage, aiProcessingStatus, aiProcessingData } = useSelector(
    (state: RootState) => state.notification,
  );

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingDocs();
    } else if (activeTab === "organized") {
      fetchMajors();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedMajor) {
      fetchDocsByMajor(selectedMajor.majorId);
    }
  }, [selectedMajor]);

  // Helper to compile validation report errors
  const getValidationErrors = (report: any): string[] => {
    if (!report) return [];
    const ruleKeys = [
      "po_plo_rule",
      "total_credits_rule",
      "excluded_credits_rule",
      "general_education_credits",
      "professional_education_credits",
      "assessment_rule",
      "course_catalog_validation",
      "course_detail_mapping",
      "source_validation",
    ];
    const errors: string[] = [];
    ruleKeys.forEach((key) => {
      const val = report[key];
      if (val && val !== "Valid Data" && val !== "Bypassed") {
        errors.push(val);
      }
    });
    return errors;
  };

  // WebSocket Watcher for Validation
  useEffect(() => {
    if (validationState === "validating") {
      if (aiProcessingStatus === "IMPORT_SUCCESS") {
        setValidationState("success");
        setValidationError(null);
        showToast("PDF Content Validated Successfully!", "success");
        dispatch(clearAiProcessingMessage());
      } else if (aiProcessingStatus === "VALIDATE_SUCCESS") {
        const errors = getValidationErrors(aiProcessingData);
        if (errors.length > 0) {
          setValidationState("error");
          setValidationError(errors.join("\n\n"));
          showToast("Validation completed with inconsistencies", "error");
        } else {
          setValidationState("success");
          setValidationError(null);
          showToast("PDF Content Validated Successfully!", "success");
        }
        dispatch(clearAiProcessingMessage());
      } else if (
        aiProcessingStatus === "PDF_PROCESS_FAIL" ||
        aiProcessingStatus === "VALIDATE_FAIL"
      ) {
        setValidationState("error");
        setValidationError(
          aiProcessingMessage ||
            "Document content does not meet the requirements for extraction.",
        );
        showToast("Validation Failed", "error");
        dispatch(clearAiProcessingMessage());
      }
    }
  }, [
    aiProcessingStatus,
    validationState,
    aiProcessingMessage,
    aiProcessingData,
    dispatch,
    showToast,
  ]);

  const fetchPendingDocs = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/document");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Fetch Pending Docs Error:", errorData);
        throw new Error(errorData.message || "Failed to fetch documents");
      }
      const result = await res.json();

      if (result.data) {
        const pending = result.data
          .filter((doc: any) => !doc.majorId)
          .map((doc: any) => {
            const fileName =
              doc.documentUrl.split("/").pop()?.split("?")[0] || "document.pdf";
            const title = fileName.replace(".pdf", "").replace(/-/g, " ");
            return {
              id: doc.documentId,
              title: title,
              fileName: fileName,
              date: new Date(doc.createdAt).toLocaleDateString(),
              status: "Waiting for HoCFDC",
              documentUrl: doc.documentUrl,
            };
          });
        setPendingDocs(pending);
      }
    } catch (error) {
      console.error(error);
      showToast("Could not load pending documents", "error");
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchMajors = async () => {
    setLoadingMajors(true);
    try {
      // Query as requested: searchBy=all&page=0&size=10&sort=majorCode&sort=asc
      const res = await MajorService.getMajors({
        searchBy: "all",
        page: 0,
        size: 50, // Taking more to show all
        sort: ["majorCode", "asc"],
      });
      setMajors(res.data.content);
    } catch (error: any) {
      showToast(error.message || "Failed to load majors", "error");
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchDocsByMajor = async (majorId: string) => {
    setLoadingDocs(true);
    try {
      const res = await DocumentService.getAllDocuments({ majorId });
      setMajorDocs(res.data);
    } catch (error: any) {
      showToast(error.message || "Failed to load major documents", "error");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        showToast("Only PDF files are allowed", "error");
        return;
      }
      setFile(selectedFile);

      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      if (!documentTitle) {
        setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setUploadedUrl(null);
      setValidationState("idle");
      setValidationError(null);
    }
  };

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleValidate = async () => {
    if (!file || !documentTitle) {
      showToast("Please provide both a PDF file and a document title", "error");
      return;
    }

    setValidationState("validating");
    setValidationStartTime(Date.now());
    setValidationError(null);

    try {
      // 1. Call Extraction API for Validation directly (via FormData)
      const formData = new FormData();
      formData.append("file", file);

      const validateRes = await fetch("/api/regulations/extract", {
        method: "POST",
        body: formData,
      });

      if (!validateRes.ok) {
        throw new Error("Failed to start validation process");
      }

      showToast("Document analysis started...", "success");
    } catch (error: any) {
      console.error("Validation Error:", error);
      setValidationState("error");
      setValidationError(error.message);
      showToast(error.message, "error");
    }
  };

  const handleFinalUpload = async () => {
    if (!file || !documentTitle) return;

    setUploading(true);
    try {
      // 1. Upload to Supabase (Storage)
      const cleanTitle = removeVietnameseTones(documentTitle.trim() || "document");
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
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload document to storage.");
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;

      // 2. Call backend API to create a new document record
      const docResponse = await fetch("/api/document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentUrl: publicUrl,
          majorId: null,
        }),
      });

      if (!docResponse.ok) {
        const errData = await docResponse.json().catch(() => ({}));
        console.error("Backend API Error:", errData);
        throw new Error(
          errData.message || "Failed to save document record in the system.",
        );
      }

      showToast("Document added successfully!", "success");
      resetModal();
      if (activeTab === "pending") {
        fetchPendingDocs();
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      showToast(error.message || "Failed to upload to Supabase", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDirectUpload = async () => {
    if (!file || !documentTitle) return;
    
    setUploading(true);
    try {
      // 1. Upload to Supabase first
      const cleanTitle = removeVietnameseTones(documentTitle.trim() || "document");
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
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload to storage failed");
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;

      // 2. Call backend API directly
      const docResponse = await fetch("/api/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentUrl: publicUrl,
          description: documentTitle,
        }),
      });

      if (!docResponse.ok) throw new Error("Failed to create document record");

      showToast("Document added successfully (Validation skipped)", "success");
      resetModal();
      fetchPendingDocs();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setDocumentTitle("Programme Proposal of ");
    setUploadedUrl(null);
    setPreviewUrl(null);
    setValidationState("idle");
    setValidationError(null);
    setValidationStartTime(undefined);
    dispatch(clearAiProcessingMessage());
  };

  const handleAssignTask = async () => {
    if (!assignModalDoc) return;
    setAssigningTask(true);
    try {
      const payload = {
        taskName: taskForm.taskName,
        description: taskForm.description,
        action: "CREATE",
        priority: taskForm.priority,
        type: "MAJOR",
        targetId: assignModalDoc.id,
        rootTaskId: null,
        dueDate: taskForm.deadline,
      };

      const res = await fetch("/api/v1/tasks-v2/byVP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to assign task");
      }

      showToast("Task assigned to HoCFDC successfully!", "success");
      setAssignModalDoc(null);
      fetchPendingDocs(); // Refresh just in case
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to assign task", "error");
    } finally {
      setAssigningTask(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("URL copied to clipboard", "success");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 lg:p-12 font-sans text-[#2d3335]">
      {/* Header section */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#1d5c42] font-semibold mb-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">
              Archive Manager
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#2d3335] font-['Plus_Jakarta_Sans']">
            Academic Documents
          </h1>
          <p className="text-[#5a6062] mt-2 max-w-xl text-lg">
            Manage Major Proposals and regulatory documents.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-4 px-6 font-bold text-sm transition-colors relative ${activeTab === "pending" ? "text-[#1d5c42]" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Pending Processing
            {activeTab === "pending" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1d5c42]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("organized")}
            className={`pb-4 px-6 font-bold text-sm transition-colors relative ${activeTab === "organized" ? "text-[#1d5c42]" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Organized by Major
            {activeTab === "organized" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1d5c42]"
              />
            )}
          </button>
        </div>

        {/* Tab 1: Pending */}
        {activeTab === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-6 rounded-xl shadow-sm border border-black/5 gap-4">
              <div>
                <h3 className="font-bold text-lg">Unassigned Proposals</h3>
                <p className="text-zinc-500 text-sm">
                  These documents are waiting for HoCFDC to extract data and
                  assign to a Major.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-[#1d5c42] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1d5c42]/20 hover:bg-[#144330] transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Upload Proposal
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px] table-fixed">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-black/5 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                      <th className="p-4 w-[35%]">Document Title</th>
                      <th className="p-4 w-[25%]">File Name</th>
                      <th className="p-4 w-[12%]">Uploaded</th>
                      <th className="p-4 w-[15%]">Status</th>
                      <th className="p-4 w-[13%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {loadingPending ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-zinc-500"
                        >
                          <Loader2
                            size={24}
                            className="animate-spin mx-auto mb-2"
                          />
                          <p>Loading documents...</p>
                        </td>
                      </tr>
                    ) : pendingDocs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-zinc-500 font-medium"
                        >
                          No pending proposals found.
                        </td>
                      </tr>
                    ) : (
                      pendingDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-zinc-50 transition-colors group"
                        >
                          <td className="p-4 font-semibold text-[#1d5c42] align-top">
                            <div className="flex items-start gap-3 w-full">
                              <FileText
                                size={18}
                                className="text-zinc-400 group-hover:text-[#1d5c42] transition-colors shrink-0 mt-0.5"
                              />
                              <span
                                onClick={() => doc.documentUrl && window.open(doc.documentUrl, "_blank")}
                                className="capitalize break-words break-all whitespace-normal leading-tight flex-1 min-w-0 cursor-pointer hover:underline hover:text-[#144330] inline-flex items-center gap-1"
                              >
                                {doc.title}
                                <ExternalLink
                                  size={12}
                                  className="inline opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-zinc-400 shrink-0"
                                />
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-zinc-500 break-all whitespace-normal leading-tight">
                            {doc.fileName}
                          </td>
                          <td className="p-4 text-sm text-zinc-500">
                            {doc.date}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200 whitespace-nowrap">
                              <Clock size={12} />
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setAssignModalDoc(doc);
                                setTaskForm({
                                  ...taskForm,
                                  taskName: `Extract Major: ${doc.title}`,
                                  description: `Please review the uploaded PDF "${doc.fileName}" and extract the major identity, program outcomes, and curriculum structure.`,
                                });
                              }}
                              className="px-3 py-1.5 bg-[#e8f5e9] text-[#1d5c42] rounded-lg text-xs font-bold hover:bg-[#1d5c42] hover:text-white transition-all shadow-sm border border-[#1d5c42]/20 flex items-center gap-1.5 whitespace-nowrap group/btn"
                            >
                              <Send
                                size={14}
                                className="group-hover/btn:translate-x-0.5 transition-transform"
                              />
                              Assign Task
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Organized */}
        {activeTab === "organized" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation Header if Major Selected */}
            {selectedMajor && (
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedMajor(null)}
                  className="flex items-center gap-2 text-[#1d5c42] font-bold text-sm hover:translate-x-[-4px] transition-transform"
                >
                  <ArrowLeft size={18} />
                  Back to Majors
                </button>
                <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <Folder size={14} />
                  <span>Majors</span>
                  <ChevronRight size={14} />
                  <span className="text-[#1d5c42] font-bold">{selectedMajor.majorName}</span>
                </div>
              </div>
            )}

            {!selectedMajor ? (
              // Folders View
              loadingMajors ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : majors.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-zinc-100">
                  <Folder size={48} className="mx-auto text-zinc-200 mb-4" />
                  <p className="text-zinc-500 font-medium">No majors found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {majors.map((major) => (
                    <motion.button
                      key={major.majorId}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMajor(major)}
                      className="group bg-white p-6 rounded-2xl border border-zinc-200/60 hover:border-[#1d5c42]/30 hover:shadow-xl hover:shadow-[#1d5c42]/5 transition-all text-left relative overflow-hidden"
                    >
                      {/* Decorative Folder Shape Background */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500" />
                      
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-50 text-[#1d5c42] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1d5c42] group-hover:text-white transition-colors duration-300">
                          <Folder size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-800 mb-1 line-clamp-1 group-hover:text-[#1d5c42] transition-colors">
                          {major.majorName}
                        </h3>
                        <p className="text-[10px] uppercase tracking-wider font-black text-zinc-400 group-hover:text-zinc-500">
                          {major.majorCode}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )
            ) : (
              // Documents Grid View
              loadingDocs ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-[3/4] bg-white rounded-xl border border-zinc-100 animate-pulse" />
                      <div className="h-4 bg-zinc-100 rounded w-3/4 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : majorDocs.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-zinc-100">
                  <FileBox size={48} className="mx-auto text-zinc-200 mb-4" />
                  <p className="text-zinc-500 font-medium">No documents found for this major.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {majorDocs.map((doc) => (
                    <motion.div
                      key={doc.documentId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group cursor-pointer"
                      onClick={() => window.open(doc.documentUrl, "_blank")}
                    >
                      {/* PDF Cover Mockup */}
                      <div className="aspect-[3/4] bg-white rounded-xl border border-zinc-200 shadow-sm group-hover:shadow-xl group-hover:border-[#1d5c42]/30 group-hover:translate-y-[-8px] transition-all duration-300 overflow-hidden relative flex flex-col p-4">
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <FileText size={32} />
                          </div>
                          <div className="text-center">
                            <div className="h-1 w-12 bg-zinc-100 mx-auto rounded-full mb-1" />
                            <div className="h-1 w-8 bg-zinc-100 mx-auto rounded-full" />
                          </div>
                        </div>
                        
                        {/* Overlay with details on hover */}
                        <div className="absolute inset-0 bg-[#1d5c42]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                          <ExternalLink className="text-white mb-2" size={24} />
                          <span className="text-white text-[10px] font-bold uppercase tracking-widest">Open PDF</span>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                           <div className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[8px] font-black uppercase tracking-tighter">
                             PDF
                           </div>
                        </div>
                      </div>
                      
                      {/* Document Info */}
                      <div className="mt-3 text-center">
                        <h4 className="font-bold text-xs text-zinc-700 group-hover:text-[#1d5c42] transition-colors line-clamp-2 leading-relaxed">
                          {doc.name || doc.description || doc.documentUrl.split('/').pop()?.split('?')[0] || "Untitled Document"}
                        </h4>
                        <p className="text-[9px] text-zinc-400 mt-1 font-medium">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Unknown date"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={resetModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col h-[92vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Upload size={20} className="text-[#1d5c42]" />
                  Upload New Proposal
                </h2>
                <button
                  onClick={resetModal}
                  className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: PDF Preview */}
                <div className="hidden lg:block w-3/5 bg-zinc-100/50 relative border-r border-zinc-200">
                  {previewUrl ? (
                    <div className="absolute inset-0 p-6">
                      <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden relative">
                        <iframe
                          src={previewUrl}
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
                        Please select a proposal file on the right to begin
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Panel: Inputs & Validation */}
                <div className="w-full lg:w-2/5 p-10 overflow-y-auto bg-zinc-50/30">
                  {validationState === "idle" ? (
                    <div className="space-y-10 max-w-lg mx-auto">
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                          Setup New Proposal
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium">
                          Provide basic details and upload the official PDF
                          document for validation.
                        </p>
                      </div>

                      {/* Document Title Input */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                          Proposed Document Title
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. Đề án mở ngành Trí tuệ nhân tạo..."
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            className="w-full p-5 pl-14 bg-white border border-zinc-200 rounded-2xl focus:border-[#1d5c42] focus:ring-4 focus:ring-[#1d5c42]/10 outline-none transition-all font-bold shadow-sm placeholder:text-zinc-300"
                          />
                          <FileText
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"
                            size={24}
                          />
                        </div>
                      </div>

                      {/* PDF Dropzone */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                          Document Source
                        </label>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-zinc-200 rounded-[2rem] p-12 text-center hover:border-[#1d5c42] hover:bg-[#1d5c42]/5 transition-all cursor-pointer group bg-white shadow-sm hover:shadow-xl hover:shadow-[#1d5c42]/5"
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf"
                          />
                          {file ? (
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mb-5 rotate-6 group-hover:rotate-0 transition-transform shadow-inner">
                                <CheckCircle2 size={40} />
                              </div>
                              <p className="font-black text-zinc-900 mb-2">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white bg-[#1d5c42] px-3 py-1 rounded-full uppercase">
                                  Ready
                                </span>
                                <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full uppercase">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-400 mb-5 group-hover:text-[#1d5c42] group-hover:bg-[#1d5c42]/10 transition-all shadow-inner">
                                <Upload size={40} />
                              </div>
                              <p className="font-black text-zinc-900">
                                Drop PDF here
                              </p>
                              <p className="text-xs text-zinc-400 mt-2 font-medium">
                                Click to browse your institutional files
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : validationState === "validating" ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-[#1d5c42]/10 border-t-[#1d5c42] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShieldCheck
                            className="text-[#1d5c42] animate-pulse"
                            size={32}
                          />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-[#2d3335] mb-2">
                        Analyzing Proposal Content
                      </h3>
                      <p className="text-zinc-500 text-sm max-w-sm mb-2">
                        Our AI is verifying if the PDF contains all necessary
                        sections for regulation extraction.
                      </p>
                      <div className="text-[#1d5c42] font-black text-xs uppercase tracking-widest bg-[#1d5c42]/10 px-4 py-1.5 rounded-full mb-6">
                        {aiProcessingMessage ||
                          "Extracting structural metadata..."}{" "}
                        <Timer startTime={validationStartTime} />
                      </div>

                      <ValidationProgress startTime={validationStartTime || undefined} />
                    </div>
                  ) : validationState === "success" ? (
                    <div className="space-y-6">
                      <div className="bg-[#1d5c42] rounded-2xl p-8 text-white relative overflow-hidden text-center shadow-xl shadow-emerald-900/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner backdrop-blur-md">
                          <SearchCheck size={40} className="text-white" />
                        </div>
                        <h4 className="text-2xl font-black mb-2">
                          Validation Passed
                        </h4>
                        <p className="text-emerald-100/80 text-sm font-medium leading-relaxed">
                          The PDF structure is compliant. All necessary sections
                          (POs, PLOs, Course Mappings) were successfully
                          identified.
                        </p>
                      </div>

                      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/50 space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                          Analysis Summary
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                            <span className="text-xs font-bold">
                              Curriculum Structure
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                            <span className="text-xs font-bold">
                              Major Identity
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                            <span className="text-xs font-bold">
                              Program Outcomes
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                            <span className="text-xs font-bold">
                              Mapping Tables
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <ShieldAlert size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">
                        Document Non-Compliant
                      </h3>
                      <div className="bg-red-50 text-red-700 p-5 rounded-2xl text-xs font-semibold border border-red-100 mb-8 w-full max-w-md max-h-[350px] overflow-y-auto whitespace-pre-wrap text-left shadow-inner">
                        {validationError}
                      </div>
                      <button
                        onClick={() => setValidationState("idle")}
                        className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                      >
                        Try with another file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
                {validationState === "idle" ? (
                  <>
                    <button
                      onClick={resetModal}
                      className="px-6 py-3 font-bold text-sm text-zinc-500 hover:text-zinc-700 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!file || !documentTitle || uploading}
                      onClick={handleDirectUpload}
                      className="px-6 py-3 font-bold text-sm text-zinc-500 hover:text-[#1d5c42] hover:bg-[#1d5c42]/5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : "Skip & Add"}
                    </button>
                    <button
                      disabled={!file || !documentTitle || uploading}
                      onClick={handleValidate}
                      className="px-8 py-3 bg-[#1d5c42] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1d5c42]/20 hover:bg-[#144330] transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
                    >
                      <FileSearch size={18} />
                      Validate PDF Content
                    </button>
                  </>
                ) : validationState === "success" ? (
                  <>
                    <button
                      onClick={() => setValidationState("idle")}
                      className="px-6 py-3 font-bold text-sm text-zinc-500 hover:text-zinc-700 rounded-xl transition-all"
                    >
                      Change File
                    </button>
                    <button
                      disabled={uploading}
                      onClick={handleFinalUpload}
                      className="px-8 py-3 bg-[#1d5c42] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1d5c42]/20 hover:bg-[#144330] transition-all flex items-center gap-2 active:scale-95"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Adding
                          to System...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} /> Confirm & Add to System
                        </>
                      )}
                    </button>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}

        {/* Assign Task Modal */}
        {assignModalDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAssignModalDoc(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-[#e8f5e9] to-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-[#1d5c42]">
                    <Send size={20} />
                    Assign to HoCFDC
                  </h2>
                  <button
                    onClick={() => setAssignModalDoc(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm font-medium text-zinc-600">
                  Document:{" "}
                  <span className="text-[#1d5c42] font-bold">
                    {assignModalDoc.title}
                  </span>
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <AlertCircle
                    size={20}
                    className="shrink-0 mt-0.5 text-amber-600"
                  />
                  <p className="text-sm">
                    This will create a task for the Head of Curriculum Framework
                    (HoCFDC) to process the PDF and create the Major.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={taskForm.taskName}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, taskName: e.target.value })
                    }
                    className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-[#1d5c42] focus:ring-2 focus:ring-[#1d5c42]/20 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter task details or special instructions..."
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-[#1d5c42] focus:ring-2 focus:ring-[#1d5c42]/20 outline-none transition-all font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, priority: e.target.value })
                      }
                      className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-[#1d5c42] focus:ring-2 focus:ring-[#1d5c42]/20 outline-none transition-all font-medium appearance-none"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                      Deadline
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={taskForm.deadline}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, deadline: e.target.value })
                        }
                        className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-[#1d5c42] focus:ring-2 focus:ring-[#1d5c42]/20 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
                <button
                  onClick={() => setAssignModalDoc(null)}
                  className="px-5 py-2.5 font-bold text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={
                    assigningTask || !taskForm.taskName || !taskForm.deadline
                  }
                  onClick={handleAssignTask}
                  className="px-6 py-2.5 bg-[#1d5c42] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1d5c42]/20 hover:bg-[#144330] transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {assigningTask ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Send Task
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
