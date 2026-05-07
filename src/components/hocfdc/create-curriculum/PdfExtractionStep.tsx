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
  Edit2,
} from "lucide-react";
import { MajorService } from "@/services/major.service";
import { RegulationService } from "@/services/regulation.service";
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

const CourseMappingItem = ({ item, onSave }: { item: string; onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const cleanItem = item.replace(/^[-•]\s*/, "").trim();
  const match = cleanItem.match(/(.+)\s*\(([^)]+)\)/);
  
  const initialName = match ? match[1].trim() : cleanItem;
  const rawParts = match ? match[2].split('|') : [];
  const parts = [...rawParts];
  while (parts.length < 6) parts.push("?");

  const [formData, setFormData] = useState({
    name: initialName,
    code: parts[0],
    sem: parts[1],
    tc: parts[2],
    lt: parts[3],
    th: parts[4],
    self: parts[5]
  });

  const handleLocalSave = () => {
    const newString = `${formData.name} (${formData.code}|${formData.sem}|${formData.tc}|${formData.lt}|${formData.th}|${formData.self})`;
    onSave(newString);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-inner animate-in zoom-in-95 duration-200">
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <label className="text-[9px] font-bold text-primary/60 uppercase">Subject Name</label>
            <input 
              className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-sm focus:border-primary outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-primary/60 uppercase">Code</label>
            <input 
              className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-sm focus:border-primary outline-none"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
            />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {["sem", "tc", "lt", "th", "self"].map((field) => (
            <div key={field}>
              <label className="text-[9px] font-bold text-primary/60 uppercase">{field === "self" ? "Self" : field}</label>
              <input 
                className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-xs text-center focus:border-primary outline-none"
                value={(formData as any)[field]}
                onChange={e => setFormData({...formData, [field]: e.target.value})}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-black/5 rounded-lg transition">Cancel</button>
          <button onClick={handleLocalSave} className="px-4 py-1 text-xs font-bold bg-primary text-white rounded-lg shadow-md hover:bg-primary-dark transition flex items-center gap-1">
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 bg-white border border-outline/10 rounded-xl shadow-sm hover:border-primary/30 transition-all group/item relative">
      <button 
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 hover:bg-primary/10 text-primary transition-all"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      
      <div className="flex items-start justify-between gap-2 pr-8">
        <span className="font-bold text-sm text-on-surface leading-tight flex-1">{formData.name}</span>
        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
          {formData.code}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase">Semester</span>
          <span className="text-xs font-bold text-primary">{formData.sem}</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-outline/10 pl-4">
          <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase">Credits</span>
          <span className="text-xs font-bold text-primary">{formData.tc}</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-outline/10 pl-4">
          <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase">T/P/S</span>
          <div className="flex items-center gap-1 text-xs font-medium text-on-surface-variant">
             <span className="font-bold text-primary">{formData.lt}</span>
             <span className="opacity-30">/</span>
             <span className="font-bold text-primary">{formData.th}</span>
             <span className="opacity-30">/</span>
             <span className="font-bold text-primary">{formData.self}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SourceDocumentItem = ({ item, onSave }: { item: string; onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const cleanItem = item.replace(/^[-•]\s*/, "").trim();
  const parts = cleanItem.split('/');
  
  const [formData, setFormData] = useState(() => {
    if (parts.length <= 6) {
      return {
        src: parts[0] || "?",
        sub: parts[1] || "?",
        title: parts[2] || "",
        author: parts[3] || "x",
        publisher: parts[4] || "x",
        year: parts[5] || "x"
      };
    } else {
      // Handle cases where title might contain slashes
      return {
        src: parts[0] || "?",
        sub: parts[1] || "?",
        year: parts[parts.length - 1] || "x",
        publisher: parts[parts.length - 2] || "x",
        author: parts[parts.length - 3] || "x",
        title: parts.slice(2, parts.length - 3).join("/") || ""
      };
    }
  });

  const handleLocalSave = () => {
    const newString = `${formData.src}/${formData.sub}/${formData.title}/${formData.author}/${formData.publisher}/${formData.year}`;
    onSave(newString);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-inner animate-in zoom-in-95 duration-200">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-bold text-emerald-700/60 uppercase">Source Code</label>
            <input 
              className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-xs focus:border-emerald-600 outline-none"
              value={formData.src}
              onChange={e => setFormData({...formData, src: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-emerald-700/60 uppercase">Subject Code</label>
            <input 
              className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-xs focus:border-emerald-600 outline-none"
              value={formData.sub}
              onChange={e => setFormData({...formData, sub: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-bold text-emerald-700/60 uppercase">Document Title</label>
          <textarea 
            className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-sm focus:border-emerald-600 outline-none min-h-[60px]"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-bold text-emerald-700/60 uppercase">Author</label>
            <input 
              className="w-full bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-xs focus:border-emerald-600 outline-none"
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-emerald-700/60 uppercase">Publisher / Year</label>
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-xs focus:border-emerald-600 outline-none"
                value={formData.publisher}
                onChange={e => setFormData({...formData, publisher: e.target.value})}
              />
              <input 
                className="w-16 bg-white border border-outline/20 rounded-lg px-2 py-1.5 text-xs text-center focus:border-emerald-600 outline-none"
                value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-black/5 rounded-lg transition">Cancel</button>
          <button onClick={handleLocalSave} className="px-4 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition flex items-center gap-1">
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border border-outline/10 rounded-xl shadow-sm hover:border-emerald-600/30 transition-all group/item relative">
      <button 
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 hover:bg-emerald-600/10 text-emerald-600 transition-all"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start justify-between gap-2 pr-8">
        <span className="font-bold text-sm text-on-surface leading-tight flex-1 whitespace-normal break-words" title={formData.title}>{formData.title}</span>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[9px] font-black bg-emerald-600/10 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-wider">
            SRC: {formData.src}
          </span>
          <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
            SUB: {formData.sub}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase">Author</span>
          <span className="text-[11px] font-medium text-on-surface whitespace-normal break-words" title={formData.author}>{formData.author === 'x' ? 'Unknown' : formData.author}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase">Publisher / Year</span>
          <span className="text-[11px] font-medium text-on-surface">
            {formData.publisher === 'x' ? 'Unknown' : formData.publisher} {formData.year !== 'x' && <span className="opacity-40">({formData.year})</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

const RegulationCard = ({
  reg,
  idx,
  onUpdate,
  onRemove,
}: {
  reg: Regulation;
  idx: number;
  onUpdate: (id: string, field: "type" | "content", val: string) => void;
  onRemove: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(idx === 0);
  const [isRawMode, setIsRawMode] = useState(false);
  const [localType, setLocalType] = useState(reg.type);
  const [localContent, setLocalContent] = useState(reg.content);

  // Keep local state in sync with external updates (like AI processing)
  useEffect(() => {
    setLocalType(reg.type);
  }, [reg.type]);

  useEffect(() => {
    setLocalContent(reg.content);
  }, [reg.content]);

  const isCourseMapping = reg.code === "COURSE_MAPPING";
  const isSourceDocs = reg.code === "SOURCE_DOCUMENTS";
  const isStructured = isCourseMapping || isSourceDocs;

  const handleSaveRaw = () => {
    onUpdate(reg.id, "type", localType);
    onUpdate(reg.id, "content", localContent);
    if (isStructured) setIsRawMode(false);
  };

  return (
    <div className="group flex flex-col p-3 bg-surface-container/30 border border-outline/20 rounded-xl hover:border-primary/30 transition overflow-hidden">
      <div className="flex items-start gap-3 w-full">
        <div className="mt-1.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <input
              value={localType}
              onChange={(e) => setLocalType(e.target.value)}
              onBlur={() => {
                if (localType !== reg.type) onUpdate(reg.id, "type", localType);
              }}
              className="bg-transparent text-xs font-bold text-on-surface-variant uppercase tracking-wider outline-none w-full focus:text-primary transition"
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
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
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
            <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {isStructured && !isRawMode ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    {isCourseMapping ? (
                      <div className="text-[10px] font-bold text-on-surface-variant/60 flex items-center gap-3">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/20"></div> T: Theory</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/20"></div> P: Practical</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/20"></div> S: Self-study</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-on-surface-variant/60 flex items-center gap-3">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-600/20"></div> SRC: Source Code</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/20"></div> SUB: Subject Code</span>
                      </div>
                    )}
                    <button 
                      onClick={() => setIsRawMode(true)}
                      className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                    >
                      <Wand2 className="w-3 h-3" /> EDIT RAW
                    </button>
                  </div>
                  <div className="grid gap-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                    {reg.content.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => {
                      const handleItemSave = (newVal: string) => {
                        const lines = reg.content.split('\n');
                        lines[i] = `- ${newVal}`;
                        onUpdate(reg.id, "content", lines.join('\n'));
                      };
                      
                      return isCourseMapping 
                        ? <CourseMappingItem key={i} item={line} onSave={handleItemSave} />
                        : <SourceDocumentItem key={i} item={line} onSave={handleItemSave} />
                    })}
                  </div>
                  <button 
                    onClick={() => {
                      const template = isCourseMapping 
                        ? "- New Subject (CODE|1|3|30|15|90)"
                        : "- SRC/SUB/Title/Author/Publisher/2024";
                      onUpdate(reg.id, "content", reg.content + "\n" + template);
                    }}
                    className="w-full py-2 border border-dashed border-outline/30 rounded-xl text-xs font-bold text-on-surface-variant/50 hover:border-primary/50 hover:text-primary transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> {isCourseMapping ? "ADD SUBJECT" : "ADD SOURCE DOCUMENT"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    className="w-full bg-white border border-outline/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary min-h-[150px] max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar shadow-inner"
                    placeholder="Rule description..."
                    autoFocus={isRawMode || !isStructured}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-on-surface-variant/50 italic">
                      {isRawMode ? "You are editing in Raw Mode" : "Generic regulation"}
                    </div>
                    <div className="flex gap-2">
                      {isStructured && (
                        <button 
                          onClick={() => setIsRawMode(false)}
                          className="px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-variant/20 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={handleSaveRaw}
                        disabled={localContent === reg.content && localType === reg.type}
                        className="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-lg shadow-md hover:bg-primary-dark transition flex items-center gap-1.5 disabled:opacity-50 disabled:shadow-none"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
  code: string;
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
  const fetchFinalData = useCallback(
    async (majorId: string) => {
      try {
        // Fetch Major Info
        const majorRes = await fetch(`/api/majors/${majorId}`);
        if (!majorRes.ok) {
          console.warn("Major ID not found in system, resetting state to idle.");
          setExtractionState("idle");
          sessionStorage.removeItem(`extracted_major_${documentId}`);
          return;
        }

        const rawMajor = await majorRes.json();
        const majorData = rawMajor.data || rawMajor;

        setMajorForm({
          majorCode: majorData.code || majorData.majorCode || "",
          majorName: majorData.name || majorData.majorName || "",
          description: majorData.description || "",
        });

        // Fetch Regulations
        const regRes = await fetch(
          `/api/regulations/major/${majorId}?size=100`,
        );
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
              if (code === "SOURCE_DOCUMENTS") {
                // Logic: Each item has exactly 6 fields separated by 5 slashes.
                // The 6th field (Year) is followed by a comma and the start of the next item.
                const allParts = content.split('/');
                const items: string[] = [];
                let currentItemParts: string[] = [];
                
                for (let i = 0; i < allParts.length; i++) {
                  const part = allParts[i].trim();
                  if (currentItemParts.length < 5) {
                    currentItemParts.push(part);
                  } else {
                    // This is the 6th part (Year + potentially next item's first part)
                    const splitByComma = part.split(/,\s*/);
                    const year = splitByComma[0];
                    currentItemParts.push(year);
                    
                    // Save the completed item
                    items.push("- " + currentItemParts.join('/'));
                    
                    // Start next item with the remaining parts (if any)
                    currentItemParts = splitByComma.slice(1);
                  }
                }
                // Handle last item if exists
                if (currentItemParts.length > 0 && currentItemParts.some(p => p.trim())) {
                  items.push("- " + currentItemParts.join('/'));
                }
                content = items.join("\n");
              } else if (code === "COURSE_MAPPING") {
                // COURSE_MAPPING items end with a closing parenthesis followed by a comma
                content = content
                  .split(/\),\s*/)
                  .map((item: string, idx: number, arr: any[]) => {
                    const clean = item.trim();
                    if (!clean) return "";
                    // Re-add the closing parenthesis except for the last item which might already have it
                    return `- ${clean}${idx < arr.length - 1 || !clean.endsWith(')') ? ')' : ''}`;
                  })
                  .filter(l => l.trim() && l !== "- )")
                  .join("\n");
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

        // Successfully loaded everything
        setExtractionState("review");
        toast.success("Extraction data loaded successfully!");
        dispatch(clearAiProcessingMessage());
      } catch (err) {
        console.error("Failed to fetch major data", err);
        setExtractionState("idle");
        toast.error("Failed to load extraction data. Please try again.");
      }
    },
    [dispatch, documentId],
  );

  // Restore state on reload
  useEffect(() => {
    const savedMajorId = sessionStorage.getItem(
      `extracted_major_${documentId}`,
    );
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
              code: r.code || r.type || "Regulation",
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
  const updateRegulationField = async (
    id: string,
    field: "type" | "content",
    value: string,
  ) => {
    // Update local state first for immediate UI response
    setRegulations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

    // Persist to backend if it's a real record (UUID)
    if (id && !id.startsWith("reg-")) {
      try {
        let majorId = sessionStorage.getItem(`extracted_major_${documentId}`);
        
        // Fallback: If session missing, try to fetch via majorCode
        if (!majorId && majorForm.majorCode) {
          const majorRes = await MajorService.getMajorByCode(majorForm.majorCode);
          majorId = majorRes.data?.majorId;
          if (majorId) sessionStorage.setItem(`extracted_major_${documentId}`, majorId);
        }

        if (!majorId) {
          console.warn("MajorId not found, skipping sync");
          return;
        }

        const reg = regulations.find((r) => r.id === id);
        if (reg) {
          // Prepare formatted value for backend (revert multiline/bullets to comma-separated)
          let backendValue = field === "content" ? value : reg.content;
          if (reg.code === "COURSE_MAPPING" || reg.code === "SOURCE_DOCUMENTS") {
            backendValue = backendValue
              .split("\n")
              .map((line) => line.replace(/^[-•]\s*/, "").trim())
              .filter((line) => line.length > 0)
              .join(", ");
          }

          // Prepare payload exactly as per Swagger documentation
          const payload = {
            code: reg.code,
            name: field === "type" ? value : reg.type,
            value: backendValue,
            majorId: majorId,
          };

          await RegulationService.updateRegulation(id, payload);
          toast.success("Changes synced to database");
        }
      } catch (err: any) {
        console.error("Failed to sync regulation:", err);
        toast.error("Sync failed: Check console for details");
      }
    }
  };
  const removeRegulation = (id: string) => {
    setRegulations((prev) => prev.filter((r) => r.id !== id));
  };
  const addRegulation = () => {
    setRegulations([
      ...regulations,
      { id: Date.now().toString(), type: "Custom Rule", code: "CUSTOM_RULE", content: "" },
    ]);
  };

  // 4. Save Major & Complete
  const handleConfirm = async () => {
    setSaving(true);
    try {
      const majorId = sessionStorage.getItem(`extracted_major_${documentId}`);
      if (!majorId) {
        toast.error("No extracted Major ID found in session. Please try extracting again.");
        return;
      }

      // 1. Update the Major with the reviewed values to ensure everything is saved
      // According to user request: ensure all fields are sent to avoid nulls in DB
      await MajorService.updateMajor(majorId, {
        majorCode: majorForm.majorCode,
        majorName: majorForm.majorName,
        description: majorForm.description,
      });

      // 2. Note: Regulations are currently kept in local state 'regulations'. 
      // If there's a bulk save API, it should be called here.
      // For now, we proceed to link the Major to the Task and Document.

      toast.success("Major identity saved successfully!");
      onComplete(majorId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to confirm major and regulations");
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
                      className={`w-full rounded-xl border border-outline bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition overflow-hidden group ${!isDescExpanded ? "cursor-pointer hover:border-primary/50 p-3" : "p-3"}`}
                      onClick={() => !isDescExpanded && setIsDescExpanded(true)}
                    >
                      {!isDescExpanded ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-on-surface-variant line-clamp-2">
                            {majorForm.description ||
                              "No description provided."}
                          </p>
                          <ChevronDown className="w-4 h-4 text-outline group-hover:text-primary transition shrink-0 ml-2" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDescExpanded(false);
                              }}
                              className="p-1 rounded hover:bg-surface-container transition text-on-surface-variant flex items-center gap-1 text-xs font-medium"
                            >
                              <ChevronUp className="w-4 h-4" />
                              Collapse
                            </button>
                          </div>
                          <textarea
                            value={majorForm.description}
                            onChange={(e) =>
                              setMajorForm({
                                ...majorForm,
                                description: e.target.value,
                              })
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
