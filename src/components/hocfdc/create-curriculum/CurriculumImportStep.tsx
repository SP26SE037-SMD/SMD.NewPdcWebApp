import React, { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface CurriculumImportStepProps {
  majorId: string;
  onImportSuccess: (curriculumId: string) => void;
}

export default function CurriculumImportStep({ majorId, onImportSuccess }: CurriculumImportStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Mock validation state. Replace with real API data later.
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: { row: number; column: string; message: string; type: "hard" | "soft" }[];
  } | null>(null);

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
    } else {
      toast.error("Please upload a valid Excel file (.xlsx)");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null); // Reset validation
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setIsValidating(true);
    
    // TODO: Replace with actual API call to validate the Excel file
    // Example: const res = await CurriculumService.validateCurriculumExcel(file, majorId);
    
    // Simulating API delay
    setTimeout(() => {
      setIsValidating(false);
      // For now, mock a successful validation. 
      // If you want to see errors, change isValid to false and add items to errors array.
      setValidationResult({
        isValid: true,
        errors: [],
      });
      toast.success("Validation completed!");
    }, 1500);
  };

  const handleImport = async () => {
    if (!file || !validationResult?.isValid) return;
    setIsImporting(true);

    // TODO: Replace with actual API call to execute import
    // Example: const res = await CurriculumService.importCurriculumExcel(file, majorId);
    
    // Simulating API delay
    setTimeout(() => {
      setIsImporting(false);
      toast.success("Curriculum imported successfully!");
      // Call onImportSuccess with a mock curriculumId for now
      onImportSuccess("mock-curriculum-id-123");
    }, 2000);
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-8 items-center justify-center min-h-[500px]">
      <div className="text-center max-w-lg">
        <h2 className="text-2xl font-black text-on-surface mb-2 tracking-tight">Import Curriculum</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Upload the <b>Full_Curriculum.xlsx</b> file. The system will automatically validate the content against the major's regulations before importing.
        </p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Upload Zone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-outline/30 bg-surface hover:border-primary/50 hover:bg-surface-container/30"
            }`}
          >
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              id="excel-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="excel-upload" className="flex flex-col items-center cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">Click or drag Excel file here</h3>
              <p className="text-sm text-on-surface-variant">Maximum file size 10MB (.xlsx)</p>
            </label>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-outline/20 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-outline/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-base">{file.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setValidationResult(null);
                }}
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation State */}
            {!validationResult ? (
              <div className="flex flex-col items-center py-4">
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-3 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validating Document...
                    </>
                  ) : (
                    "Run Validation"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {validationResult.isValid ? (
                  <div className="flex items-start gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold mb-1">Validation Passed</h5>
                      <p className="text-sm opacity-90">The Excel file structure and data align with the Major's regulations. You can now proceed to import.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-error/10 text-error rounded-xl border border-error/20">
                      <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold mb-1">Validation Failed</h5>
                        <p className="text-sm opacity-90">Please fix the following errors in your Excel file and upload again.</p>
                      </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-outline/20 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-container/50 text-on-surface-variant font-bold border-b border-outline/20">
                          <tr>
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Column</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline/10">
                          {validationResult.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-surface-container/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-on-surface">{err.row}</td>
                              <td className="px-4 py-3 text-on-surface-variant">{err.column}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  err.type === 'hard' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning-dark'
                                }`}>
                                  {err.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-on-surface">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-outline/10">
                  <button
                    onClick={handleImport}
                    disabled={!validationResult.isValid || isImporting}
                    className="px-8 py-3 bg-[#1d5c42] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#144330] transition shadow-lg shadow-[#1d5c42]/20 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      "Execute Import"
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
