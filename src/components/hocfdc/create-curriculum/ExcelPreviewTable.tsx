import React, { useState } from "react";
import { AlertCircle, FileSpreadsheet, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type SheetData = (string | number | null)[][];

export interface ExcelErrorMap {
  [sheetName: string]: {
    [rowIndex: number]: string; // Error message for that row index
    // Note: index -1 is used for general sheet errors
  };
}

interface ExcelPreviewTableProps {
  workbookData: { [sheetName: string]: SheetData };
  errorMap: ExcelErrorMap;
}

export default function ExcelPreviewTable({ workbookData, errorMap }: ExcelPreviewTableProps) {
  const sheetNames = Object.keys(workbookData);
  const [activeSheet, setActiveSheet] = useState<string>(sheetNames[0] || "");

  if (sheetNames.length === 0) return null;

  const currentSheetData = workbookData[activeSheet] || [];
  const currentSheetErrors = errorMap[activeSheet] || {};

  const getColumnWidth = (colIndex: number) => {
    const isWide = 
      (activeSheet === "Major" && (colIndex === 1 || colIndex === 2)) ||
      (activeSheet === "Curriculum" && (colIndex === 1 || colIndex === 3)) ||
      (activeSheet === "Subject" && colIndex === 2) ||
      (activeSheet === "Group" && colIndex === 2);
      
    return isWide ? "min-w-[300px]" : "min-w-[150px]";
  };

  return (
    <div className="w-full bg-surface border border-outline/20 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px] max-h-[70vh]">
      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto bg-surface-container/30 px-2 pt-2 border-b border-outline/10 scrollbar-hide">
        {sheetNames.map((sheetName) => {
          const hasError = Object.keys(errorMap[sheetName] || {}).length > 0;
          const isActive = activeSheet === sheetName;
          
          return (
            <button
              key={sheetName}
              onClick={() => setActiveSheet(sheetName)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition relative ${
                isActive
                  ? "bg-surface text-primary border-t border-x border-outline/10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10"
                  : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${isActive ? "text-primary" : "text-on-surface-variant/70"}`} />
              {sheetName}
              
              {hasError && (
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                </span>
              )}
              
              {/* Active indicator line */}
              {isActive && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary z-20"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Spreadsheet Content */}
      <div className="flex-1 overflow-auto bg-white relative excel-scrollbar">
        {/* General Sheet Errors Banner */}
        {currentSheetErrors[-1] && (
          <div className="sticky top-0 left-0 right-0 z-30 bg-red-50 border-b border-red-200 p-3 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Sheet Validation Error</h4>
              <p className="text-xs text-red-700 font-bold whitespace-pre-wrap leading-relaxed">
                {currentSheetErrors[-1]}
              </p>
            </div>
          </div>
        )}

        {currentSheetData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-on-surface-variant text-sm">
            This sheet is empty.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-surface-container/50 shadow-sm backdrop-blur-md">
              <tr>
                <th className="border border-outline/10 p-2 text-center w-12 bg-surface-variant/30 text-on-surface-variant font-medium select-none sticky left-0 z-20 backdrop-blur-md">
                  #
                </th>
                {/* Dynamically create columns A, B, C based on the longest row */}
                {Array.from({ length: Math.max(...currentSheetData.map(r => r.length)) }).map((_, i) => (
                  <th key={i} className={`border border-outline/10 p-2 ${getColumnWidth(i)} max-w-[500px] font-bold text-on-surface-variant bg-surface-variant/30 select-none`}>
                    {String.fromCharCode(65 + (i % 26))}
                    {i >= 26 ? Math.floor(i / 26) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSheetData.map((row, rowIndex) => {
                const isHeaderRow = rowIndex === 0;
                
                // Detect sub-headers
                const isSubHeader = !isHeaderRow && row.some(cell => 
                  typeof cell === 'string' && 
                  /code|name|year|description|mapping|credits|level|allocation/i.test(cell)
                ) && row.every(cell => cell === null || cell === "" || typeof cell === 'string');

                const errorMsg = currentSheetErrors[rowIndex];
                const isErrorRow = !!errorMsg;

                return (
                  <tr 
                    key={rowIndex} 
                    className={`group transition-colors ${
                      isHeaderRow 
                        ? 'bg-primary/10 font-bold' 
                        : isErrorRow 
                          ? 'bg-red-50 hover:bg-red-100 relative' 
                          : 'hover:bg-surface-variant/20'
                    }`}
                  >
                    <td className={`border border-outline/10 p-1 text-xs font-medium text-on-surface-variant/60 select-none sticky left-0 z-10 ${
                      isErrorRow ? 'bg-red-100 text-red-600 font-bold' : 'bg-surface-container/20 group-hover:bg-surface-variant/40'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        {isErrorRow && (
                          <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                        )}
                        <span>{rowIndex + 1}</span>
                      </div>
                    </td>
                    
                    {Array.from({ length: Math.max(...currentSheetData.map(r => r.length)) }).map((_, colIndex) => {
                      const cellValue = row[colIndex];
                      
                      // Check if this specific cell should be purple
                      const isPurpleCell = (activeSheet === "Major" && rowIndex === 3 && (colIndex === 0 || colIndex === 1)) ||
                                           (activeSheet === "Curriculum" && rowIndex === 3 && (colIndex === 0 || colIndex === 1 || colIndex === 2));

                      return (
                        <td 
                          key={colIndex} 
                          className={`border border-outline/10 px-3 py-2 relative text-xs align-top ${
                            isHeaderRow || isPurpleCell ? 'text-center' : ''
                          } ${
                            isPurpleCell ? 'bg-[#EADEF7] font-bold text-[#4B0082]' : ''
                          } ${
                            isErrorRow ? 'text-red-700' : 'text-on-surface'
                          }`}
                          title={cellValue !== undefined && cellValue !== null ? String(cellValue) : ""}
                        >
                          <div className={`whitespace-normal break-words min-h-[1.2em] ${!isHeaderRow && !isSubHeader ? (getColumnWidth(colIndex).includes('300') ? 'max-w-[500px]' : 'max-w-[400px]') : ''}`}>
                            {cellValue !== undefined && cellValue !== null ? String(cellValue) : ""}
                          </div>
                          
                          {/* Only show error tooltip on the first data column if row has error */}
                          {isErrorRow && colIndex === 0 && (
                            <div className="absolute z-50 left-0 top-full mt-1 hidden group-hover:flex w-max max-w-sm p-3 bg-red-600 text-white text-xs rounded-lg shadow-xl shadow-red-900/20 font-medium">
                              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-white" />
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
      <div className="bg-surface-container/20 px-4 py-2 border-t border-outline/10 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>{currentSheetData.length} rows in {activeSheet}</span>
        </div>
        {Object.keys(currentSheetErrors).length > 0 && (
          <div className="text-error font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {Object.keys(currentSheetErrors).length} errors in this sheet
          </div>
        )}
      </div>
    </div>
  );
}
