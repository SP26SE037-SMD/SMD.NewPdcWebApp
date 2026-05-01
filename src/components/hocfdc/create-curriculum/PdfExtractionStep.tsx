"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Wand2,
  Loader2,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Save,
  ListChecks,
  Target,
  X,
  Plus,
  Download,
} from "lucide-react";
import { MajorService } from "@/services/major.service";
import { toast } from "sonner";

interface PdfExtractionStepProps {
  documentId: string;
  onComplete: (majorId: string) => void;
}

interface Regulation {
  id: string;
  type: string;
  content: string;
}

export default function PdfExtractionStep({
  documentId,
  onComplete,
}: PdfExtractionStepProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  const [extractionState, setExtractionState] = useState<
    "idle" | "extracting" | "review"
  >("idle");
  const [majorForm, setMajorForm] = useState({
    majorCode: "",
    majorName: "",
    description: "",
  });
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [saving, setSaving] = useState(false);

  // 1. Fetch document URL
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/document/${documentId}`);
        const json = await res.json();
        const doc = json.data || json;
        
        if (doc && doc.documentUrl) {
          // Remove ?download= to prevent auto-downloading in iframe
          const cleanUrl = doc.documentUrl.replace('?download=', '');
          setDocumentUrl(cleanUrl);
        } else {
          toast.error("Document not found or inaccessible.");
        }
      } catch (err) {
        console.error("Failed to fetch document", err);
        toast.error("Failed to load document.");
      } finally {
        setLoadingDoc(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  // 2. Real AI Extraction
  const handleExtract = async () => {
    if (!documentUrl) return;
    setExtractionState("extracting");
    
    try {
      // 1. Fetch the PDF file as a Blob from the Supabase URL
      const pdfResponse = await fetch(documentUrl);
      if (!pdfResponse.ok) throw new Error("Failed to download PDF for extraction");
      const pdfBlob = await pdfResponse.blob();

      // 2. Create FormData
      const formData = new FormData();
      formData.append("file", pdfBlob, "document.pdf");

      // 3. Call the extraction API proxy
      const apiRes = await fetch('/api/regulations/extract', {
        method: 'POST',
        body: formData
      });
      
      const result = await apiRes.json();
      
      if (!apiRes.ok) {
        throw new Error(result.error || result.message || "Extraction failed");
      }

      // 4. Parse response (adapt to whatever structure the backend returns)
      const data = result.data || result;
      
      setMajorForm({
        majorCode: data.majorCode || "",
        majorName: data.majorName || "",
        description: data.description || ""
      });

      // Handle regulations array mapping
      if (Array.isArray(data.regulations)) {
        setRegulations(data.regulations.map((r: any, idx: number) => ({
          id: r.id || `reg-${Date.now()}-${idx}`,
          type: r.type || "Regulation",
          content: r.content || r.description || JSON.stringify(r)
        })));
      } else {
        setRegulations([]);
      }

      setExtractionState("review");
      toast.success("Extraction completed successfully!");
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast.error(err.message || "An error occurred during extraction.");
      setExtractionState("idle");
    }
  };

  // 3. Edit Regulations
  const updateRegulation = (id: string, newContent: string) => {
    setRegulations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, content: newContent } : r)),
    );
  };
  const removeRegulation = (id: string) => {
    setRegulations((prev) => prev.filter((r) => r.id !== id));
  };
  const addRegulation = () => {
    setRegulations([
      ...regulations,
      { id: Date.now().toString(), type: "Custom Rule", content: "" },
    ]);
  };

  // 4. Save Major & Complete
  const handleConfirm = async () => {
    if (!majorForm.majorCode || !majorForm.majorName) {
      toast.error("Please provide Major Code and Name.");
      return;
    }
    setSaving(true);
    try {
      // Create major
      const res = await MajorService.createMajor({
        majorCode: majorForm.majorCode,
        majorName: majorForm.majorName,
        description: majorForm.description,
      });
      const newMajor = (res as any)?.data;

      if (!newMajor || !newMajor.majorId)
        throw new Error("Failed to create major");

      // Ideally we would also update the Document with the new majorId here
      // and save the Regulations to a new backend endpoint.

      toast.success("Major and regulations verified successfully!");
      onComplete(newMajor.majorId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create major");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* LEFT: PDF Viewer */}
      <div className="lg:w-3/5 bg-surface rounded-2xl border border-outline/20 overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-outline/20 bg-surface-container/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-primary h-5 w-5" />
            <h3 className="font-bold text-on-surface">
              Original Proposal Document
            </h3>
          </div>
          {documentUrl && (
            <a
              href={`${documentUrl}?download=`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-outline/20 hover:border-primary/40 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition shadow-sm"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          )}
        </div>
        <div className="flex-1 bg-zinc-100 relative">
          {loadingDoc ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : documentUrl ? (
            <iframe
              src={`${documentUrl}#navpanes=0&view=FitH`}
              className="w-full h-full border-none"
              title="PDF Viewer"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant">
              <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
              <p>Document not available.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Extraction & Review Panel */}
      <div className="lg:w-2/5 bg-surface rounded-2xl border border-outline/20 flex flex-col shadow-sm overflow-hidden relative">
        {/* State: Idle */}
        <AnimatePresence mode="wait">
          {extractionState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Wand2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-on-surface mb-3">
                AI Document Extraction
              </h2>
              <p className="text-on-surface-variant max-w-md mb-8">
                Our AI will scan the PDF proposal, extract the Major details,
                and identify all curriculum regulations and constraints.
              </p>
              <button
                onClick={handleExtract}
                disabled={!documentUrl}
                className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-3 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                Start Extraction Process <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* State: Extracting */}
          {extractionState === "extracting" && (
            <motion.div
              key="extracting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                <Wand2 className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-on-surface mb-2">
                Analyzing Proposal...
              </h2>
              <p className="text-on-surface-variant text-sm animate-pulse">
                Reading sections and parsing regulations...
              </p>
            </motion.div>
          )}

          {/* State: Review */}
          {extractionState === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <div className="p-5 border-b border-outline/20 bg-emerald-50/50 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600 h-6 w-6" />
                <div>
                  <h3 className="font-bold text-emerald-900">
                    Extraction Complete
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Please review and adjust the extracted data below.
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Major Info Section */}
                <section>
                  <h4 className="text-sm font-black uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4" /> Major Identity
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">
                        Major Code
                      </label>
                      <input
                        value={majorForm.majorCode}
                        onChange={(e) =>
                          setMajorForm({
                            ...majorForm,
                            majorCode: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-surface border border-outline/30 rounded-xl focus:border-primary outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">
                        Major Name
                      </label>
                      <input
                        value={majorForm.majorName}
                        onChange={(e) =>
                          setMajorForm({
                            ...majorForm,
                            majorName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-surface border border-outline/30 rounded-xl focus:border-primary outline-none font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Description
                    </label>
                    <textarea
                      value={majorForm.description}
                      onChange={(e) =>
                        setMajorForm({
                          ...majorForm,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-4 py-2.5 bg-surface border border-outline/30 rounded-xl focus:border-primary outline-none text-sm resize-none"
                    />
                  </div>
                </section>

                <hr className="border-outline/10" />

                {/* Regulations Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                      <ListChecks className="h-4 w-4" /> Extracted Regulations
                    </h4>
                    <button
                      onClick={addRegulation}
                      className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Rule
                    </button>
                  </div>

                  <div className="space-y-3">
                    {regulations.map((reg, idx) => (
                      <div
                        key={reg.id}
                        className="group flex items-start gap-3 p-3 bg-surface-container/30 border border-outline/20 rounded-xl hover:border-primary/30 transition"
                      >
                        <div className="mt-2.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            value={reg.type}
                            onChange={(e) => {
                              const newRegs = [...regulations];
                              newRegs[idx].type = e.target.value;
                              setRegulations(newRegs);
                            }}
                            className="bg-transparent text-xs font-bold text-on-surface-variant uppercase tracking-wider outline-none w-full"
                            placeholder="Rule Type..."
                          />
                          <textarea
                            value={reg.content}
                            onChange={(e) =>
                              updateRegulation(reg.id, e.target.value)
                            }
                            rows={2}
                            className="w-full bg-white border border-outline/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                            placeholder="Rule description..."
                          />
                        </div>
                        <button
                          onClick={() => removeRegulation(reg.id)}
                          className="mt-2 p-1.5 text-error/60 hover:text-error hover:bg-error/10 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {regulations.length === 0 && (
                      <p className="text-center text-sm text-on-surface-variant py-4 italic">
                        No regulations found. Add manually if needed.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* Action Footer */}
              <div className="p-5 border-t border-outline/20 bg-surface flex justify-end gap-3 shrink-0">
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="px-6 py-3 bg-[#1d5c42] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#144330] transition shadow-lg shadow-[#1d5c42]/20 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Confirm & Create Major
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
