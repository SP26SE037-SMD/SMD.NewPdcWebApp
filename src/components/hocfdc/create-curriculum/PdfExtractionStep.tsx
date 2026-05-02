"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Wand2,
  Loader2,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
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
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { clearAiProcessingMessage } from "@/store/slices/notificationSlice";

const Timer = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) {
      return `${m}m${s}s`;
    }
    return `${s}s`;
  };

  return (
    <span className="inline-block ml-1 opacity-80">
      ({formatTime(seconds)})
    </span>
  );
};

const FAKE_TASKS = [
  "Analyzing PDF Structure",
  "Extracting TRAINING_LEVEL",
  "Extracting PO_PLO_RULE",
  "Extracting TOTAL_CREDITS",
  "Extracting EXCLUDED_CREDITS",
  "Extracting GENERAL_EDU_CREDITS",
  "Extracting PROFESSIONAL_EDU_CREDITS",
  "Extracting THEORY_LIMIT",
  "Extracting DISCUSSION_LIMIT",
  "Extracting MAX_WEEKLY_PERIODS",
  "Extracting SELF_STUDY_FORMULA",
  "Extracting ASSESSMENT_RATIO",
  "Extracting COURSE_CATALOG",
  "Extracting COURSE_MAPPING",
  "Extracting SOURCE_DOCUMENTS",
  "Verifying Regulation Consistency",
  "Finalizing Data Extraction",
];

const SimulatedExtractionProgress = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Approx 2m10s (130 seconds) total for 17 tasks = ~7.6 seconds per task
    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, FAKE_TASKS.length - 1));
    }, 7600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 text-left w-full max-w-sm mx-auto bg-surface-container-lowest/50 rounded-xl p-5 border border-outline/10 shadow-inner h-[180px] overflow-hidden relative">
      {/* Fade masks for smooth scrolling effect */}
      <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-surface to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-surface to-transparent z-10"></div>

      <div
        className="flex flex-col gap-3 transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateY(-${Math.max(0, currentIndex - 2) * 36}px)`,
        }}
      >
        {FAKE_TASKS.map((task, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          if (idx > currentIndex + 3) return null; // Don't render too far in the future

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-sm h-6 transition-all duration-500 ${
                isPast
                  ? "text-primary/60"
                  : isCurrent
                    ? "text-primary font-bold scale-105 origin-left"
                    : "text-on-surface-variant/40"
              }`}
            >
              {isPast && <CheckCircle2 className="w-4 h-4 min-w-4" />}
              {isCurrent && (
                <Loader2 className="w-4 h-4 min-w-4 animate-spin text-primary" />
              )}
              {!isPast && !isCurrent && (
                <Circle className="w-4 h-4 min-w-4 opacity-50" />
              )}
              <span className="truncate">{task}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RegulationCard = ({ reg, idx, onUpdate, onRemove }: any) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group flex flex-col p-3 bg-surface-container/30 border border-outline/20 rounded-xl hover:border-primary/30 transition overflow-hidden">
      <div className="flex items-start gap-3 w-full">
        <div className="mt-1.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <input
              value={reg.type}
              onChange={(e) => onUpdate(reg.id, "type", e.target.value)}
              className="bg-transparent text-xs font-bold text-on-surface-variant uppercase tracking-wider outline-none w-full"
              placeholder="Rule Type..."
            />
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reg.content);
                  toast.success("Copied to clipboard");
                }}
                className="p-1 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded"
                title="Copy content"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRemove(reg.id)}
                className="p-1 text-error/60 hover:text-error hover:bg-error/10 rounded"
                title="Remove rule"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-on-surface-variant hover:bg-surface-variant/20 rounded"
                title="Toggle expand"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {!expanded ? (
            <p 
              className="text-sm text-on-surface-variant truncate cursor-pointer pr-8"
              onClick={() => setExpanded(true)}
            >
              {reg.content || "Empty content..."}
            </p>
          ) : (
            <textarea
              value={reg.content}
              onChange={(e) => onUpdate(reg.id, "content", e.target.value)}
              className="w-full mt-2 bg-white border border-outline/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary min-h-[100px] max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar"
              placeholder="Rule description..."
            />
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [majorForm, setMajorForm] = useState({
    majorCode: "",
    majorName: "",
    description: "",
  });
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Get the real-time AI processing message from Redux
  const { aiProcessingMessage, aiProcessingStatus } = useSelector(
    (state: RootState) => state.notification,
  );
  const dispatch = useDispatch();

  // Extract fetch logic so it can be reused on reload
  const fetchFinalData = useCallback(async (majorId: string) => {
    try {
      // Fetch Major Info
      const majorRes = await fetch(`/api/majors/${majorId}`);
      if (majorRes.ok) {
        const rawMajor = await majorRes.json();
        const majorData = rawMajor.data || rawMajor;
        
        setMajorForm({
          majorCode: majorData.code || majorData.majorCode || "",
          majorName: majorData.name || majorData.majorName || "",
          description: majorData.description || "",
        });
      }

      // Fetch Regulations
      const regRes = await fetch(`/api/regulations/major/${majorId}?size=100`);
      if (regRes.ok) {
        const rawReg = await regRes.json();
        // Extract items from data.content based on Swagger response
        const items = rawReg?.data?.content || [];

        if (Array.isArray(items) && items.length > 0) {
          const SORT_ORDER = [
            "TRAINING_LEVEL",
            "PO_PLO_RULE",
            "TOTAL_CREDITS",
            "EXCLUDED_CREDITS",
            "GENERAL_EDU_CREDITS",
            "PROFESSIONAL_EDU_CREDITS",
            "THEORY_LIMIT",
            "DISCUSSION_LIMIT",
            "MAX_WEEKLY_PERIODS",
            "SELF_STUDY_FORMULA",
            "ASSESSMENT_RATIO",
            "COURSE_CATALOG",
            "COURSE_MAPPING",
            "SOURCE_DOCUMENTS",
          ];

          const mappedItems = items.map((r: any, idx: number) => {
            const type = r.name || r.code || "Regulation";
            const code = r.code || r.name || "Regulation";
            let content: string = String(r.value || "");

            // Format specific long comma-separated strings into multiline with bullet points
            if (code === "COURSE_MAPPING" || code === "SOURCE_DOCUMENTS") {
              // Split by comma followed by optional spaces, add bullet points, and join with newline
              content = content.split(/,\s*/).map((item: string) => `- ${item}`).join("\n");
            }

            return {
              id: r.regulationId || `reg-${Date.now()}-${idx}`,
              type,
              code,
              content,
            };
          });

          mappedItems.sort((a, b) => {
            let indexA = SORT_ORDER.indexOf(a.code);
            let indexB = SORT_ORDER.indexOf(b.code);
            if (indexA === -1) indexA = 999;
            if (indexB === -1) indexB = 999;
            return indexA - indexB;
          });

          setRegulations(mappedItems);
        } else {
           setRegulations([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch major data", err);
    } finally {
      setExtractionState("review");
      toast.success("Extraction data loaded successfully!");
      dispatch(clearAiProcessingMessage());
    }
  }, [dispatch]);

  // Restore state on reload
  useEffect(() => {
    const savedMajorId = sessionStorage.getItem(`extracted_major_${documentId}`);
    if (savedMajorId && extractionState === "idle") {
      setExtractionState("extracting"); // Prevent double fetching
      fetchFinalData(savedMajorId);
    }
  }, [documentId, extractionState]);

  // Watch for WebSocket status to handle FAIL and SUCCESS specifically
  useEffect(() => {
    if (extractionState === "extracting") {
      if (aiProcessingStatus === "IMPORT_SUCCESS") {
        const majorId = aiProcessingMessage;
        // UUID usually looks like a long string. If it's valid, fetch.
        if (majorId && majorId.length > 10) {
          sessionStorage.setItem(`extracted_major_${documentId}`, majorId);
          fetchFinalData(majorId);
        } else {
          setExtractionState("review");
          toast.success("Extraction completed successfully!");
          dispatch(clearAiProcessingMessage());
        }
      } else if (aiProcessingStatus === "PDF_PROCESS_FAIL") {
        setExtractionState("idle");
        const errMsg =
          aiProcessingMessage ||
          "AI failed to generate valid content, please try again!";
        setExtractionError(errMsg);
        toast.error(errMsg);
        dispatch(clearAiProcessingMessage());
      }
    }
  }, [aiProcessingStatus, extractionState, dispatch, aiProcessingMessage]);

  // 1. Fetch document URL
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/document/${documentId}`);
        const json = await res.json();
        const doc = json.data || json;

        if (doc && doc.documentUrl) {
          // Remove ?download= to prevent auto-downloading in iframe
          const cleanUrl = doc.documentUrl.replace("?download=", "");
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
    setExtractionError(null);

    try {
      // 1. Fetch the PDF file as a Blob from the Supabase URL
      const pdfResponse = await fetch(documentUrl);
      if (!pdfResponse.ok)
        throw new Error("Failed to download PDF for extraction");
      const pdfBlob = await pdfResponse.blob();

      // 2. Create FormData
      const formData = new FormData();
      formData.append("file", pdfBlob, "document.pdf");

      // 3. Call the extraction API proxy
      const apiRes = await fetch("/api/regulations/extract", {
        method: "POST",
        body: formData,
      });

      const result = await apiRes.json();

      if (!apiRes.ok) {
        throw new Error(result.error || result.message || "Extraction failed");
      }

      // 4. Parse response (adapt to whatever structure the backend returns)
      const data = result.data || result;

      // Xử lý mapping data (nếu API trả về data)
      // Việc chuyển state sang "review" sẽ do useEffect của WebSocket đảm nhiệm
      if (data) {
        setMajorForm({
          majorCode: data.majorCode || "",
          majorName: data.majorName || "",
          description: data.description || "",
        });

        // Handle regulations array mapping
        if (Array.isArray(data.regulations) && data.regulations.length > 0) {
          setRegulations(
            data.regulations.map((r: any, idx: number) => ({
              id: r.id || `reg-${Date.now()}-${idx}`,
              type: r.type || "Regulation",
              content: r.content || r.description || JSON.stringify(r),
            })),
          );
        }
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast.error(
        err.message || "An error occurred during extraction API call.",
      );
      setExtractionState("idle");
      dispatch(clearAiProcessingMessage());
    }
  };

  // 3. Edit Regulations
  const updateRegulationField = (id: string, field: "type" | "content", value: string) => {
    setRegulations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
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
    setSaving(true);
    try {
      // Retrieve the majorId that was extracted by the AI
      const savedMajorId = sessionStorage.getItem(`extracted_major_${documentId}`);
      if (!savedMajorId) {
        toast.error("No extracted Major ID found in session. Please try extracting again.");
        return;
      }

      // Trigger onComplete which will call the Document and Task update APIs
      onComplete(savedMajorId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to confirm major");
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
              <p className="text-on-surface-variant max-w-md mb-6">
                Our AI will scan the PDF proposal, extract the Major details,
                and identify all curriculum regulations and constraints.
              </p>

              {extractionError && (
                <div className="mb-6 w-full max-w-sm p-4 bg-error/10 text-error rounded-xl border border-error/20 flex items-start gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{extractionError}</p>
                </div>
              )}

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
              <p className="text-on-surface-variant text-sm text-primary font-medium max-w-sm flex items-center justify-center">
                {aiProcessingMessage ? (
                  <span>
                    {aiProcessingMessage} <Timer />
                  </span>
                ) : (
                  <span>
                    Reading sections and parsing regulations <Timer />
                  </span>
                )}
              </p>

              {/* Fake Progress List to simulate heavy background AI task */}
              <SimulatedExtractionProgress />
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
                  <div>
                    <label className="text-sm font-medium text-on-surface mb-1.5 block">
                      Description
                    </label>
                    <div 
                      className={`w-full rounded-xl border border-outline bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition overflow-hidden group ${!isDescExpanded ? 'cursor-pointer hover:border-primary/50 p-3' : 'p-3'}`}
                      onClick={() => !isDescExpanded && setIsDescExpanded(true)}
                    >
                      {!isDescExpanded ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-on-surface-variant line-clamp-2">
                            {majorForm.description || "No description provided."}
                          </p>
                          <ChevronDown className="w-4 h-4 text-outline group-hover:text-primary transition shrink-0 ml-2" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); setIsDescExpanded(false); }}
                              className="p-1 rounded hover:bg-surface-container transition text-on-surface-variant flex items-center gap-1 text-xs font-medium"
                            >
                              <ChevronUp className="w-4 h-4" />
                              Collapse
                            </button>
                          </div>
                          <textarea
                            value={majorForm.description}
                            onChange={(e) =>
                              setMajorForm({ ...majorForm, description: e.target.value })
                            }
                            rows={5}
                            autoFocus
                            className="w-full bg-transparent outline-none resize-y min-h-[100px] text-sm text-on-surface"
                          />
                        </div>
                      )}
                    </div>
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
                      <RegulationCard
                        key={reg.id}
                        reg={reg}
                        idx={idx}
                        onUpdate={updateRegulationField}
                        onRemove={removeRegulation}
                      />
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
                  Confirm Major & Regulations
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
