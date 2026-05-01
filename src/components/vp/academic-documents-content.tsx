"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Upload, CheckCircle2, Loader2, Copy, ExternalLink,
  ShieldCheck, X, FileDown, Clock, Folder, ChevronDown, Plus, Send, Calendar, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://blydhlkiaqmgdhnueqad.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWRobGtpYXFtZ2RobnVlcWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Mjk2ODMsImV4cCI6MjA5MzEwNTY4M30.oeBAhVfqlHLOC8wgbKE1yL3AW_y835IgBEd9nPJaiuI";
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

// --- MOCK DATA ---
// Mock data for Organized Tab (Pending is fetched from API)

const MOCK_ORGANIZED_DOCS = [
  {
    majorName: "Information Technology (IT)",
    documents: [
      { id: 101, title: "Đề án mở ngành IT 2023", fileName: "IT-Proposal-2023.pdf", date: "2023-01-15" },
      { id: 102, title: "Quyết định phê duyệt IT", fileName: "Approval-IT.pdf", date: "2023-02-20" }
    ]
  },
  {
    majorName: "Artificial Intelligence (AI)",
    documents: [
      { id: 201, title: "Đề án ngành Trí tuệ nhân tạo", fileName: "AI-Proposal-Final.pdf", date: "2023-06-10" }
    ]
  }
];

export default function AcademicDocumentsContent() {
  const [activeTab, setActiveTab] = useState<"pending" | "organized">("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedMajor, setExpandedMajor] = useState<string | null>("Information Technology (IT)");

  // API State
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Upload State
  const [file, setFile] = useState<File | null>(null);

  // Assign Task State
  const [assignModalDoc, setAssignModalDoc] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    taskName: "Extract Major from Document",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: "HIGH"
  });
  const [assigningTask, setAssigningTask] = useState(false);

  React.useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingDocs();
    }
  }, [activeTab]);

  const fetchPendingDocs = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/document?status=ACTIVE");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const result = await res.json();
      
      if (result.data) {
        // Filter out documents that have majorId assigned
        const pending = result.data.filter((doc: any) => !doc.majorId).map((doc: any) => {
          const fileName = doc.documentUrl.split('/').pop()?.split('?')[0] || "document.pdf";
          // Convert "De-an-CNTT.pdf" back to "De an CNTT" for the Title column
          const title = fileName.replace('.pdf', '').replace(/-/g, ' ');
          return {
            id: doc.documentId,
            title: title,
            fileName: fileName,
            date: new Date(doc.createdAt).toLocaleDateString(),
            status: "Waiting for HoCFDC"
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
  const [documentTitle, setDocumentTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        showToast("Only PDF files are allowed", "error");
        return;
      }
      setFile(selectedFile);
      if (!documentTitle) {
        // Auto-fill title without extension
        setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentTitle) {
      showToast("Please provide both a PDF file and a document title", "error");
      return;
    }

    setUploading(true);
    setUploadedUrl(null);

    try {
      // Use documentTitle to set the filename in Supabase (instead of original file name)
      const cleanTitle = removeVietnameseTones(documentTitle.trim() || "document");
      const uniqueName = `${cleanTitle}.pdf`; // Tên file mượt mà, không có số thừa
      
      const filePath = encodeURIComponent(uniqueName);
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filePath}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true' // Cho phép ghi đè file cũ nếu trùng tên
        },
        body: file
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}?download=`;

      console.log("=== SUPABASE UPLOAD SUCCESS ===");
      console.log("Title:", documentTitle);
      console.log("Download URL:", publicUrl);

      setUploadedUrl(publicUrl);
      showToast("Document uploaded to Supabase successfully!", "success");
      
      // Call backend API to create a new document record with majorId = null
      const docResponse = await fetch('/api/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl: publicUrl,
          majorId: null
        })
      });

      if (!docResponse.ok) {
        const errData = await docResponse.json().catch(() => ({}));
        console.error("Backend API Error:", errData);
        throw new Error(errData.message || "Failed to save document record in the system.");
      }

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

  const resetModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setDocumentTitle("");
    setUploadedUrl(null);
  };

  const handleAssignTask = async () => {
    if (!assignModalDoc) return;
    setAssigningTask(true);
    try {
      const payload = {
        majorId: null, // Will send null since it's unassigned
        taskName: taskForm.taskName,
        description: `Please extract major from document ID: ${assignModalDoc.id}`,
        priority: taskForm.priority,
        deadline: taskForm.deadline,
        type: "CREATE_CURRICULUM" // Default task type for now
      };

      const res = await fetch("/api/tasks/byVP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Archive Manager</span>
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
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1d5c42]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("organized")}
            className={`pb-4 px-6 font-bold text-sm transition-colors relative ${activeTab === "organized" ? "text-[#1d5c42]" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Organized by Major
            {activeTab === "organized" && (
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1d5c42]" />
            )}
          </button>
        </div>

        {/* Tab 1: Pending */}
        {activeTab === "pending" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-6 rounded-xl shadow-sm border border-black/5 gap-4">
              <div>
                <h3 className="font-bold text-lg">Unassigned Proposals</h3>
                <p className="text-zinc-500 text-sm">These documents are waiting for HoCFDC to extract data and assign to a Major.</p>
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
                        <td colSpan={4} className="p-8 text-center text-zinc-500">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                          <p>Loading documents...</p>
                        </td>
                      </tr>
                    ) : pendingDocs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-zinc-500 font-medium">
                          No pending proposals found.
                        </td>
                      </tr>
                    ) : (
                      pendingDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-zinc-50 transition-colors group">
                          <td className="p-4 font-semibold text-[#1d5c42] align-top">
                            <div className="flex items-start gap-3 w-full">
                              <FileText size={18} className="text-zinc-400 group-hover:text-[#1d5c42] transition-colors shrink-0 mt-0.5" />
                              <span className="capitalize break-words break-all whitespace-normal leading-tight flex-1 min-w-0">{doc.title}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-zinc-500 break-all whitespace-normal leading-tight">{doc.fileName}</td>
                          <td className="p-4 text-sm text-zinc-500">{doc.date}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200 whitespace-nowrap">
                              <Clock size={12} />
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => setAssignModalDoc(doc)}
                              className="px-3 py-1.5 bg-[#e8f5e9] text-[#1d5c42] rounded-lg text-xs font-bold hover:bg-[#1d5c42] hover:text-white transition-all shadow-sm border border-[#1d5c42]/20 flex items-center gap-1.5 whitespace-nowrap group/btn"
                            >
                              <Send size={14} className="group-hover/btn:translate-x-0.5 transition-transform" /> 
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {MOCK_ORGANIZED_DOCS.map((major) => (
              <div key={major.majorName} className="bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden">
                <button 
                  onClick={() => setExpandedMajor(expandedMajor === major.majorName ? null : major.majorName)}
                  className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-[#e8f5e9] text-[#1d5c42] rounded-xl flex items-center justify-center shrink-0">
                      <Folder size={20} />
                    </div>
                    <h3 className="font-bold text-lg">{major.majorName}</h3>
                  </div>
                  <ChevronDown size={20} className={`text-zinc-400 transition-transform ${expandedMajor === major.majorName ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence>
                  {expandedMajor === major.majorName && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-black/5 bg-zinc-50/50"
                    >
                      <div className="p-5 space-y-2">
                        {major.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/5 hover:border-[#1d5c42]/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText size={18} className="text-zinc-400 shrink-0" />
                              <div>
                                <p className="font-bold text-[#2d3335]">{doc.title}</p>
                                <p className="text-xs text-zinc-500">{doc.fileName} • {doc.date}</p>
                              </div>
                            </div>
                            <button className="p-2 text-zinc-400 hover:text-[#1d5c42] hover:bg-[#e8f5e9] rounded-lg transition-colors shrink-0">
                              <ExternalLink size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={resetModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Upload size={20} className="text-[#1d5c42]" />
                  Upload New Proposal
                </h2>
                <button onClick={resetModal} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {!uploadedUrl ? (
                  <div className="space-y-6">
                    {/* Document Title Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">Proposed Document Title</label>
                      <input 
                        type="text"
                        placeholder="e.g. Đề án mở ngành Trí tuệ nhân tạo..."
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-[#1d5c42] focus:ring-2 focus:ring-[#1d5c42]/20 outline-none transition-all"
                      />
                      <p className="text-xs text-zinc-500">This helps HoCFDC identify the document before processing.</p>
                    </div>

                    {/* PDF Dropzone */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-700">PDF File</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group/zone
                          ${file ? "border-[#1d5c42] bg-[#1d5c42]/5" : "border-zinc-200 hover:border-[#1d5c42] hover:bg-zinc-50"}
                        `}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf"
                          className="hidden"
                        />
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover/zone:scale-110 duration-300
                          ${file ? "bg-[#1d5c42] text-white" : "bg-zinc-100 text-zinc-400"}
                        `}>
                          {file ? <FileText size={24} /> : <FileDown size={24} />}
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm text-[#2d3335]">
                            {file ? file.name : "Click to select a PDF"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Institutional PDFs only"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Success State */
                  <div className="bg-[#1d5c42] rounded-xl p-8 text-white relative overflow-hidden text-center space-y-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-xl font-bold">Upload Successful</h4>
                    <p className="text-emerald-100/80 text-sm">The document has been securely uploaded to Supabase.</p>
                    
                    <div className="pt-4 flex justify-center gap-3">
                      <button 
                        onClick={() => copyToClipboard(uploadedUrl)}
                        className="px-5 py-2.5 bg-white text-[#1d5c42] rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm"
                      >
                        <Copy size={16} />
                        Copy URL
                      </button>
                      <a 
                        href={uploadedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-white/20 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/30 transition-all shadow-sm"
                      >
                        <ExternalLink size={16} />
                        View File
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {!uploadedUrl && (
                <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
                  <button
                    onClick={resetModal}
                    className="px-6 py-3 font-bold text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!file || !documentTitle || uploading}
                    onClick={handleUpload}
                    className="px-8 py-3 bg-[#1d5c42] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1d5c42]/20 hover:bg-[#144330] transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                  >
                    {uploading ? (
                      <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload size={16} /> Confirm Upload</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Assign Task Modal */}
        {assignModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAssignModalDoc(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-[#e8f5e9] to-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-[#1d5c42]">
                    <Send size={20} />
                    Assign to HoCFDC
                  </h2>
                  <button onClick={() => setAssignModalDoc(null)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-white/60 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm font-medium text-zinc-600">
                  Document: <span className="text-[#1d5c42] font-bold">{assignModalDoc.title}</span>
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                  <p className="text-sm">
                    This will create a task for the Head of Curriculum Framework (HoCFDC) to process the PDF and create the Major.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Task Name</label>
                  <input 
                    type="text"
                    value={taskForm.taskName}
                    onChange={(e) => setTaskForm({...taskForm, taskName: e.target.value})}
                    className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-[#1d5c42] focus:ring-2 focus:ring-[#1d5c42]/20 outline-none transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Priority</label>
                    <select 
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
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
                        onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
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
                  disabled={assigningTask || !taskForm.taskName || !taskForm.deadline}
                  onClick={handleAssignTask}
                  className="px-6 py-2.5 bg-[#1d5c42] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1d5c42]/20 hover:bg-[#144330] transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {assigningTask ? (
                    <><Loader2 size={16} className="animate-spin" /> Assigning...</>
                  ) : (
                    <><Send size={16} /> Send Task</>
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
