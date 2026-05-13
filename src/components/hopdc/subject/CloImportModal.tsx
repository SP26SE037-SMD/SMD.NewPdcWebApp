"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, FileType2, Loader2, CheckCircle2, AlertCircle, Download, Info, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import ExcelCloPreview from "./ExcelCloPreview";
import { SheetData, ExcelErrorMap } from "@/components/hocfdc/create-curriculum/ExcelPreviewTable";
import { PLO } from "@/services/curriculum.service";

interface CloImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<any>;
  plos: PLO[];
  isImporting: boolean;
  subjectCode?: string;
}

export function CloImportModal({ isOpen, onClose, onImport, plos, isImporting, subjectCode }: CloImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [workbookData, setWorkbookData] = useState<{ [sheetName: string]: SheetData }>({});
  const [errorMap, setErrorMap] = useState<ExcelErrorMap>({});
  const [dragActive, setDragActive] = useState(false);
  const [parsedClos, setParsedClos] = useState<any[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear data when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setWorkbookData({});
      setErrorMap({});
      setParsedClos([]);
      setLocalError(null);
    }
  }, [isOpen]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      alert("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setFile(selectedFile);
    setLocalError(null);
    setWorkbookData({}); // Clear old preview
    setErrorMap({});     // Clear old errors
    setParsedClos([]);   // Clear old parsed data
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert("The Excel file is empty.");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as SheetData;
      
      // We only care about the first sheet for preview and import
      const newWorkbookData: { [sheetName: string]: SheetData } = {
        [firstSheetName]: jsonData
      };
      const newErrorMap: ExcelErrorMap = {};
      let allParsedClos: any[] = [];

      const sheetErrors: { [rowIndex: number]: string } = {};
      const headers = jsonData[3]; // Row 4 (index 3)
      
      const isHeaderMatch = (h: any, expected: string) => 
        String(h || "").trim().toLowerCase() === expected.toLowerCase();

      const row1 = jsonData[0] || [];
      const row3 = jsonData[2] || [];
      const row4 = jsonData[3] || [];

      let templateErrors = [];

      // Check Row 1
      if (!isHeaderMatch(row1[0], "Subject Code") || 
          !isHeaderMatch(row1[1], "Name") || 
          !isHeaderMatch(row1[2], "Min Bloom Level") || 
          !isHeaderMatch(row1[3], "Curriculum Code")) {
        templateErrors.push("Invalid Row 1 headers (Expected: Subject Code, Name, Min Bloom Level, Curriculum Code)");
      }

      // Check Row 3 (Must be empty)
      const isRow3Empty = row3.every(cell => !cell || String(cell).trim() === "");
      if (!isRow3Empty) {
        templateErrors.push("Row 3 must be empty.");
      }

      // Check Row 4
      if (!isHeaderMatch(row4[0], "CLO Code") || 
          !isHeaderMatch(row4[1], "Description") || 
          !isHeaderMatch(row4[2], "Bloom Level") || 
          !isHeaderMatch(row4[3], "PLO Code Mapping")) {
        templateErrors.push("Invalid Row 4 headers (Expected: CLO Code, Description, Bloom Level, PLO Code Mapping)");
      }

      // Check Column E onwards (Index 4+)
      const hasExtraData = jsonData.some(row => row.slice(4).some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ""));
      if (hasExtraData) {
        templateErrors.push("Data detected in Column E or beyond. Please use the provided template structure.");
      }

      if (templateErrors.length > 0) {
        newErrorMap[firstSheetName] = { [-1]: templateErrors.join(" | ") };
      } else {
        for (let i = 4; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          const cloCode = String(row[0] || "").trim();
          const description = String(row[1] || "").trim();
          const bloomLevel = String(row[2] || "").trim();
          const ploMapping = String(row[3] || "").trim();

          if (!cloCode && !description) continue; // Skip empty rows

          allParsedClos.push({
            cloCode,
            cloName: cloCode,
            description,
            bloomLevel: bloomLevel || "1",
            ploMapping: ploMapping,
            rowIndex: i // Store row index for error mapping
          });
        }
      }

      setWorkbookData(newWorkbookData);
      setErrorMap(newErrorMap);
      setParsedClos(allParsedClos);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    const response = await onImport(file);
    
    if (response?.data) {
      const { failed, details } = response.data;
      if (failed === 0) {
        onClose();
      } else {
        // Map backend errors back to rows
        const newSheetErrors: { [rowIndex: number]: string } = {};
        const firstSheetName = Object.keys(workbookData)[0];

        details.forEach((detail: any) => {
          if (detail.status === "FAILED") {
            // Find ALL rows this cloCode belongs to (in case of duplicates)
            const matchedRows = parsedClos.filter(pc => pc.cloCode === detail.cloCode);
            matchedRows.forEach(row => {
              // Only assign if not already assigned to avoid overwriting more specific errors if any
              if (!newSheetErrors[row.rowIndex]) {
                newSheetErrors[row.rowIndex] = detail.message || "Unknown error";
              }
            });
          }
        });

        setErrorMap({
          [firstSheetName]: newSheetErrors
        });
        
        setLocalError(`Validation failed: ${failed} rows have issues. Please fix your Excel file.`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
          onClick={() => !isImporting && onClose()}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[1400px] h-full max-h-[850px] bg-white rounded-[40px] shadow-2xl overflow-hidden z-10 flex flex-col border border-zinc-200"
        >
          {/* Header */}
          <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-sm">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Import Course Learning Outcomes</h2>
                <p className="text-sm text-zinc-500 font-medium">Standardize your CLOs from Excel for <span className="text-[#0b7a47] font-bold">{subjectCode}</span></p>
              </div>
            </div>
            <button
              onClick={() => !isImporting && onClose()}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-zinc-100"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Preview Table */}
            <div className="flex-[2] border-r border-zinc-100 bg-zinc-50/30 p-8 overflow-hidden flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  Excel Preview Area
                  {file && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">{file.name}</span>}
                </h3>
                {file && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{parsedClos.length} Rows Detected</span>
                  </div>
                )}
              </div>
              
              {file ? (
                <div className="flex-1 overflow-hidden rounded-3xl border border-zinc-200 shadow-inner bg-white">
                  <ExcelCloPreview workbookData={workbookData} errorMap={errorMap} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-[32px] bg-white/50">
                  <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mb-4 text-zinc-300">
                    <FileSpreadsheet size={40} />
                  </div>
                  <p className="text-zinc-400 font-medium italic">Upload a file to preview data</p>
                </div>
              )}
            </div>

            {/* Right: Upload & Actions */}
            <div className="flex-1 p-8 flex flex-col gap-8 bg-white min-w-[400px]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Step 1: Upload Template</h4>
                  <div
                    className={`border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      dragActive ? "border-emerald-500 bg-emerald-50/50" : "border-zinc-200 bg-zinc-50/30 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {!file ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm border border-zinc-100 text-emerald-600">
                          <UploadCloud size={32} />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 mb-1">Click or drag & drop</h3>
                        <p className="text-sm text-zinc-500 font-medium">Excel files (.xlsx, .xls) only</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-[#0b7a47] text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                          <FileType2 size={32} />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 mb-1 truncate max-w-xs">{file.name}</h3>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Step 2: Review & Validation</h4>
                  <div className="space-y-3">
                    {localError && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
                        <div className="mt-0.5"><AlertCircle size={16} className="text-red-500" /></div>
                        <p className="text-xs text-red-700 leading-relaxed font-bold">
                          {localError}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                      <div className="mt-0.5"><Info size={16} className="text-zinc-400" /></div>
                      <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                        Rows with <span className="text-red-500 font-bold underline">errors</span> will be skipped during the final import process.
                      </p>
                    </div>
                    <button
                      onClick={() => window.location.href = "/Subject_CLOs.xlsx"}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-50 text-zinc-500 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Download size={16} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-600">Download Template</span>
                      </div>
                      <CheckCircle2 size={16} className="text-zinc-200" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-auto flex gap-3 pt-6 border-t border-zinc-100">
                <button
                  onClick={onClose}
                  disabled={isImporting}
                  className="flex-1 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all bg-zinc-100 text-zinc-500 hover:bg-zinc-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || parsedClos.length === 0 || isImporting}
                  className="flex-[1.5] py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all bg-[#0b7a47] text-white hover:bg-[#08683c] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-emerald-100"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Validate & Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
