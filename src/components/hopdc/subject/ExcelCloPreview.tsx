import React, { useState } from "react";
import { AlertCircle, FileSpreadsheet, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type SheetData = (string | number | null)[][];

export interface ExcelErrorMap {
  [sheetName: string]: {
    [rowIndex: number]: string; // Error message for that row index
  };
}

interface ExcelCloPreviewProps {
  workbookData: { [sheetName: string]: SheetData };
  errorMap: ExcelErrorMap;
}

export default function ExcelCloPreview({ workbookData, errorMap }: ExcelCloPreviewProps) {
  const sheetNames = Object.keys(workbookData);
  const [activeSheet, setActiveSheet] = useState<string>(sheetNames[0] || "");

  // Sync activeSheet when workbookData changes
  React.useEffect(() => {
    if (sheetNames.length > 0 && (!activeSheet || !workbookData[activeSheet])) {
      setActiveSheet(sheetNames[0]);
    }
  }, [workbookData, sheetNames, activeSheet]);

  if (sheetNames.length === 0) return null;

  const currentSheetData = workbookData[activeSheet] || [];
  const currentSheetErrors = errorMap[activeSheet] || {};

  const getColumnWidth = (colIndex: number) => {
    // CLO specific widths: Description (Col B) is usually long
    if (colIndex === 1) return "min-w-[400px]";
    if (colIndex === 3) return "min-w-[200px]";
    return "min-w-[120px]";
  };

  return (
    <div className="w-full bg-white flex flex-col h-full min-h-[400px]">
      {/* Spreadsheet Content */}
      <div className="flex-1 overflow-auto relative excel-scrollbar">
        {/* General Sheet Errors Banner */}
        {currentSheetErrors[-1] && (
          <div className="sticky top-0 left-0 right-0 z-30 bg-red-50 border-b border-red-200 p-3 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Template Validation Error</h4>
              <p className="text-xs text-red-700 font-bold whitespace-pre-wrap leading-relaxed">
                {currentSheetErrors[-1]}
              </p>
            </div>
          </div>
        )}

        {currentSheetData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-400 text-sm italic">
            This sheet is empty.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-zinc-50 shadow-sm">
              <tr>
                <th className="border border-zinc-200 p-2 text-center w-12 bg-zinc-100 text-zinc-500 font-medium select-none sticky left-0 z-20">
                  #
                </th>
                {Array.from({ length: Math.max(...currentSheetData.map(r => r.length), 4) }).map((_, i) => (
                  <th key={i} className={`border border-zinc-200 p-2 ${getColumnWidth(i)} font-bold text-zinc-400 bg-zinc-50 select-none text-left`}>
                    {String.fromCharCode(64 + (i + 1))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSheetData.map((row, rowIndex) => {
                const isHeaderRow = rowIndex === 0 || rowIndex === 3; // Row 1 and Row 4 are headers in CLO template
                const errorMsg = currentSheetErrors[rowIndex];
                const isErrorRow = !!errorMsg;

                return (
                  <tr 
                    key={rowIndex} 
                    className={`group transition-colors ${
                      isHeaderRow 
                        ? 'bg-zinc-50/50' 
                        : isErrorRow 
                          ? 'bg-rose-50/50 hover:bg-rose-50' 
                          : 'hover:bg-zinc-50/30'
                    }`}
                  >
                    <td className={`border border-zinc-200 p-1 text-xs font-medium text-center select-none sticky left-0 z-10 ${
                      isErrorRow ? 'bg-rose-100 text-rose-600 font-bold' : 'bg-zinc-50 text-zinc-400'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        {isErrorRow && <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                        <span>{rowIndex + 1}</span>
                      </div>
                    </td>
                    
                    {Array.from({ length: Math.max(...currentSheetData.map(r => r.length), 4) }).map((_, colIndex) => {
                      const cellValue = row[colIndex];
                      
                      // Highlight logic for CLO template
                      const isHighlight = isHeaderRow && colIndex < 4;

                      return (
                        <td 
                          key={colIndex} 
                          className={`border border-zinc-200 px-3 py-2 relative text-xs align-top ${
                            isHighlight ? 'bg-emerald-50/50 font-bold text-emerald-800' : ''
                          } ${
                            isErrorRow ? 'text-rose-700' : 'text-zinc-600'
                          }`}
                        >
                          <div className="whitespace-normal break-words min-h-[1.2em]">
                            {cellValue !== undefined && cellValue !== null ? String(cellValue) : ""}
                          </div>
                          
                          {/* Error Tooltip */}
                          {isErrorRow && colIndex === 0 && (
                            <div className="absolute z-50 left-0 top-full mt-1 hidden group-hover:flex w-max max-w-sm p-3 bg-zinc-900 text-white text-[11px] rounded-xl shadow-2xl font-medium">
                              <AlertCircle className="w-3.5 h-3.5 mr-2 shrink-0 text-rose-400" />
                              <span className="whitespace-normal leading-relaxed">{errorMsg}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="bg-zinc-50 px-4 py-2 border-t border-zinc-200 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        <div className="flex items-center gap-2">
          <Info size={12} />
          <span>{currentSheetData.length} rows detected</span>
        </div>
        {Object.keys(currentSheetErrors).length > 0 && (
          <div className="text-rose-500 flex items-center gap-1.5">
            <AlertCircle size={12} />
            {Object.keys(currentSheetErrors).length} rows have issues
          </div>
        )}
      </div>
    </div>
  );
}
