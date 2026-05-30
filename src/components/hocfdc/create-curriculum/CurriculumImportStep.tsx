import React, { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, X, DownloadCloud, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { CurriculumService } from "@/services/curriculum.service";
import * as XLSX from "xlsx";
import ExcelPreviewTable, { SheetData, ExcelErrorMap } from "./ExcelPreviewTable";

interface CurriculumImportStepProps {
  majorId: string;
  majorCode?: string;
  onImportSuccess: (curriculumId: string) => void;
}

export default function CurriculumImportStep({ majorId, majorCode, onImportSuccess }: CurriculumImportStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: { row: string; column: string; message: string; type: "hard" | "soft" }[];
  } | null>(null);

  const [workbookData, setWorkbookData] = useState<{ [sheetName: string]: SheetData } | null>(null);
  const [errorMap, setErrorMap] = useState<ExcelErrorMap>({});

  const parseExcelFile = (targetFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      
      const REQUIRED_SHEETS = ["Major", "Curriculum", "Subject", "Group", "Semester Mapping", "Source"];
      
      // Check if all required sheets exist
      const missingSheets = REQUIRED_SHEETS.filter(sheet => !workbook.SheetNames.includes(sheet));
      
      if (missingSheets.length > 0) {
        toast.error("Invalid template format!");
        setWorkbookData(null);
        setErrorMap({});
        setValidationResult({
          isValid: false,
          errors: [{
            row: "-",
            column: "Template",
            message: `Invalid template! Missing required sheets: ${missingSheets.join(", ")}. Please download and use the provided template.`,
            type: "hard"
          }]
        });
        return;
      }

      const newWorkbookData: { [sheetName: string]: SheetData } = {};
      
      // Load exactly the required sheets to keep the UI tabs consistent
      REQUIRED_SHEETS.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (worksheet) {
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
          newWorkbookData[sheetName] = jsonData;
        } else {
          newWorkbookData[sheetName] = [];
        }
      });
      
      // PRE-VALIDATION: Check if Major Code matches
      if (majorCode) {
        const majorSheetData = newWorkbookData["Major"];
        if (majorSheetData && majorSheetData.length > 1) {
          const importedMajorCode = String(majorSheetData[1][0] || "").trim();
          if (importedMajorCode && importedMajorCode !== majorCode.trim()) {
            toast.error("Major Code mismatch!");
            setWorkbookData(null);
            setErrorMap({});
            setValidationResult({
              isValid: false,
              errors: [{
                row: "Row 2",
                column: "Major",
                message: `Major Code mismatch! Expected [${majorCode}] but found [${importedMajorCode}]. Please use the correct Excel file for this task.`,
                type: "hard"
              }]
            });
            return; // Abort loading
          }
        }
      }
      
      // POST-PROCESSING: SheetJS (xlsx) free version does not evaluate Excel formulas.
      // If the template relies on VLOOKUP/XLOOKUP for 'Subject Name' in 'Semester Mapping', it might render empty or as '#NAME?'.
      // We will manually perform the VLOOKUP here in the frontend to ensure the UI looks perfect.
      const subjectSheet = newWorkbookData["Subject"];
      const semesterMappingSheet = newWorkbookData["Semester Mapping"];
      
      if (subjectSheet && subjectSheet.length > 1 && semesterMappingSheet && semesterMappingSheet.length > 1) {
        // Create a Map of SubjectCode -> SubjectName from the Subject sheet
        // Assuming Subject Code is Col A (0) and Subject Name is Col B (1)
        const subjectMap = new Map<string, string>();
        for (let i = 1; i < subjectSheet.length; i++) {
          const code = String(subjectSheet[i][0] || "").trim();
          const name = String(subjectSheet[i][1] || "").trim();
          if (code) {
            subjectMap.set(code, name);
          }
        }
        
        // Fill missing Subject Names in Semester Mapping sheet
        // Assuming Subject Code is Col B (1) and Subject Name is Col C (2)
        for (let i = 1; i < semesterMappingSheet.length; i++) {
          const row = semesterMappingSheet[i];
          const subjCode = String(row[1] || "").trim();
          const currentName = String(row[2] || "").trim();
          
          // If name is empty or has an Excel error like #NAME?, #N/A, #VALUE!
          if (subjCode && (!currentName || currentName.startsWith("#"))) {
            // Fill it from our map
            const mappedName = subjectMap.get(subjCode);
            if (mappedName) {
              row[2] = mappedName;
            }
          }
        }
      }

      setWorkbookData(newWorkbookData);
      setErrorMap({});
    };
    reader.readAsArrayBuffer(targetFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".xlsx")) {
      setFile(droppedFile);
      setValidationResult(null); // Reset validation
      parseExcelFile(droppedFile);
    } else {
      toast.error("Please upload a valid Excel file (.xlsx)");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null); // Reset validation
      parseExcelFile(selectedFile);
    }
  };

  const handleValidateAndImport = async () => {
    if (!file) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await CurriculumService.importFullCurriculum(file);
      const payload = res?.data;

      // The backend returns HTTP 200 but uses data.success to indicate business logic success
      if (payload && payload.success === false) {
        let errorList: any[] = [];
        let newErrorMap: ExcelErrorMap = {};
        
        const parseResult = (sheetName: string, result: any, codeKey?: string, rowKeyIndex?: number) => {
          if (!result || !result.details) return;
          if (!newErrorMap[sheetName]) newErrorMap[sheetName] = {};

          const sheetData = workbookData?.[sheetName] || [];

          result.details.forEach((d: any) => {
            if (d.status === "FAILED") {
              let rowLoc = "N/A";
              let exactRowIndex = -1;

              if (d.rowNumber) {
                rowLoc = `Row ${d.rowNumber}`;
                exactRowIndex = d.rowNumber - 1; // 0-indexed for table
              } else if (d.ploCode || d.subjectCode || d.curriculumCode || d.majorCode || d.poCode || d.sourceCode) {
                const codeToMatch = d.ploCode || d.subjectCode || d.curriculumCode || d.majorCode || d.poCode || d.sourceCode;
                rowLoc = `${d.ploCode ? 'PLO' : (d.sourceCode ? 'Source' : (codeKey || 'Code'))} ${codeToMatch}`;
                
                // Attempt to find the exact row in the parsed Excel data
                // We'll search all rows and all columns, or specifically the first few columns
                if (codeToMatch && sheetData.length > 0) {
                  for (let i = 0; i < sheetData.length; i++) {
                    const row = sheetData[i];
                    // Usually code is in the first 5 columns
                    for (let j = 0; j < Math.min(row.length, 5); j++) {
                      if (String(row[j]).trim() === String(codeToMatch).trim()) {
                        exactRowIndex = i;
                        break;
                      }
                    }
                    if (exactRowIndex !== -1) break;
                  }
                }
              }

              // Fallback for "Unknown" errors without any identifiers
              if (exactRowIndex === -1 && d.message && d.message.toLowerCase().includes("unknown")) {
                const targetColIdx = rowKeyIndex !== undefined ? rowKeyIndex : 0;
                if (sheetData.length > 0) {
                  for (let i = 1; i < sheetData.length; i++) {
                    const row = sheetData[i];
                    const isTargetEmpty = !String(row[targetColIdx] || "").trim();
                    if (isTargetEmpty && !newErrorMap[sheetName][i]) {
                      exactRowIndex = i;
                      rowLoc = `Row ${i + 1} (Missing Code)`;
                      break;
                    }
                  }
                }
              }

              if (exactRowIndex !== -1) {
                newErrorMap[sheetName][exactRowIndex] = d.message;
              } else {
                // Catch general sheet errors (no specific row)
                const existing = newErrorMap[sheetName][-1];
                newErrorMap[sheetName][-1] = existing ? `${existing}\n${d.message}` : d.message;
              }

              errorList.push({
                row: rowLoc,
                column: sheetName,
                message: d.message || "Validation error",
                type: "hard"
              });
            }
          });
        };

        parseResult("Major", payload.majorResult, "Major", 0);
        parseResult("Curriculum", payload.curriculumResult, "Curr", 0);
        parseResult("Subject", payload.subjectResult, "Subject", 0);
        parseResult("Group", payload.groupResult, "Group", 0);
        parseResult("Semester Mapping", payload.semesterMappingResult);
        parseResult("Source", payload.sourceResult, "Source", 0);

        // If for some reason we didn't parse anything but it failed
        if (errorList.length === 0) {
          errorList.push({
            row: "-", column: "Unknown", message: payload.message || "Unknown validation error", type: "hard"
          });
        }

        setErrorMap(newErrorMap);
        setValidationResult({ isValid: false, errors: errorList });
        toast.error("Validation failed. Please check the errors.");
        setIsValidating(false);
        return; // Stop here, don't proceed to success
      }
      
      // If success
      setIsValidating(false);
      setValidationResult({ isValid: true, errors: [] });
      toast.success("Curriculum imported successfully!");
      
      onImportSuccess("imported-from-excel");
      
    } catch (err: any) {
      console.error("Import error:", err);
      setIsValidating(false);
      
      // Handle network or unexpected errors (HTTP 4xx/5xx)
      setValidationResult({
        isValid: false,
        errors: [{
          row: "-",
          column: "System",
          message: err?.message || err?.error || "Failed to process the Excel file. Network error or server crashed.",
          type: "hard"
        }]
      });
      
      toast.error("Validation failed. System error occurred.");
    }
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-8 items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg mb-4">
        <h2 className="text-2xl font-black text-on-surface mb-2 tracking-tight">Import Curriculum</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Create the curriculum structure by uploading an Excel file. Please ensure you strictly follow our standardized template.
        </p>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        {/* Step 1: Download Template */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-black flex items-center justify-center shadow-md">1</div>
            <h3 className="text-lg font-bold text-on-surface">Download Template</h3>
          </div>
          <div className="bg-surface border border-outline/20 rounded-2xl p-6 shadow-sm flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Download the official <strong className="text-on-surface">Full_Curriculum.xlsx</strong> template. 
                Fill in all required fields including PLOs, Subjects, and Mappings according to the instructions inside the file. 
                Do not alter the column structures.
              </p>
            </div>
            <a 
              href="/Full_Curriculum.xlsx" 
              download 
              className="w-full py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-outline/10"
            >
              <DownloadCloud className="w-5 h-5 text-primary" />
              Download Template
            </a>
          </div>
        </div>

        {/* Step 2: Upload File */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-black flex items-center justify-center shadow-md">2</div>
            <h3 className="text-lg font-bold text-on-surface">Upload & Validate</h3>
          </div>
          
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`h-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-outline/30 bg-surface hover:border-primary/50 hover:bg-surface-container/30"
              }`}
            >
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                id="excel-upload"
                onChange={handleFileSelect}
              />
              <label htmlFor="excel-upload" className="flex flex-col items-center cursor-pointer text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary transition-transform hover:scale-105">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-on-surface mb-1">Click or drag Excel here</h4>
                <p className="text-xs text-on-surface-variant">Only .xlsx files supported</p>
              </label>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-outline/20 rounded-2xl p-6 shadow-sm h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-on-surface text-sm truncate max-w-[180px]">{file.name}</h4>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setValidationResult(null);
                    setErrorMap({});
                    setWorkbookData(null);
                  }}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Validation State */}
              <div className="flex-1 flex flex-col justify-center">
                {!validationResult ? (
                  <button
                    onClick={handleValidateAndImport}
                    disabled={isValidating}
                    className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Validating & Importing...
                      </>
                    ) : (
                      "Execute Import"
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {validationResult.isValid ? (
                      <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-sm mb-0.5">Import Successful</h5>
                          <p className="text-xs opacity-90">Curriculum is ready.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <h5 className="font-bold text-sm mb-0.5">Validation Failed</h5>
                          <p className="text-xs opacity-90 text-amber-700">Please fix the errors below and try uploading again.</p>
                        </div>
                      </div>
                    )}

                    {!validationResult.isValid && validationResult.errors.length > 0 && !workbookData && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <ul className="list-disc pl-5 space-y-1">
                          {validationResult.errors.map((err, idx) => (
                            <li key={idx}><strong>{err.column}:</strong> {err.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!validationResult.isValid && (
                      <button
                        onClick={() => { setFile(null); setValidationResult(null); setErrorMap({}); setWorkbookData(null); }}
                        className="w-full py-3 bg-surface-container-high text-on-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-surface-variant transition shadow-sm"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Excel Preview (replaces the old error table) */}
      {workbookData && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="w-full mt-4"
        >
          {validationResult && !validationResult.isValid && (
            <div className="bg-amber-50 text-amber-800 px-6 py-4 rounded-t-2xl border border-amber-200 flex items-center gap-2 mb-[-1px] relative z-10">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-bold">Validation Errors Detected</h3>
                <p className="text-sm opacity-90 text-amber-700">Please review the highlighted cells below, correct them in your Excel file, and upload again.</p>
              </div>
            </div>
          )}
          <ExcelPreviewTable workbookData={workbookData} errorMap={errorMap} />
        </motion.div>
      )}
    </div>
  );
}
