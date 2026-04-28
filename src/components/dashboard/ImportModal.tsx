import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileType2, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ImportType = 'material' | 'session' | 'assessment';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<void>;
    type: ImportType;
}

export default function ImportModal({ isOpen, onClose, onImport, type }: ImportModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const acceptedTypes = type === 'material' 
        ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

    const typeLabel = type === 'material' ? 'Word Documents (.doc, .docx)' : 'Excel/CSV Files (.xls, .xlsx, .csv)';

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
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile: File) => {
        // Basic extension check
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        let isValid = false;
        
        if (type === 'material') {
            isValid = ext === 'doc' || ext === 'docx';
        } else {
            isValid = ext === 'xls' || ext === 'xlsx' || ext === 'csv';
        }

        if (isValid) {
            setFile(selectedFile);
        } else {
            alert(`Invalid file type. Please upload ${typeLabel}.`);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    const submitImport = async () => {
        if (!file) return;
        setIsImporting(true);
        try {
            await onImport(file);
            setFile(null);
            onClose();
        } catch (error) {
            console.error("Import failed", error);
            alert("Failed to import file. Please try again.");
        } finally {
            setIsImporting(false);
        }
    };

    const C = {
        primary: "#41683f",
        surface: "#f8faf2",
        onSurface: "#2d342b",
        onSurfaceVariant: "#5a6157",
        outlineVariant: "#adb4a8",
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => !isImporting && onClose()}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden z-10"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Import {type.charAt(0).toUpperCase() + type.slice(1)}
                                </h2>
                                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-1">
                                    Upload data from file
                                </p>
                            </div>
                            <button 
                                onClick={() => !isImporting && onClose()}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#f8faf2] text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drag and Drop Area */}
                        <div 
                            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                                dragActive ? 'border-[#41683f] bg-[#41683f]/5' : 'border-[#adb4a8]/30 bg-[#f8faf2]'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={onButtonClick}
                            style={{ cursor: 'pointer' }}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept={acceptedTypes}
                                onChange={handleChange}
                                className="hidden"
                            />
                            
                            {!file ? (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-[#adb4a8]/20 text-[#41683f]">
                                        <UploadCloud size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#2d342b] mb-1">Click to upload or drag and drop</h3>
                                    <p className="text-sm text-[#5a6157]">
                                        Supports {typeLabel}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-[#41683f] text-white flex items-center justify-center mb-4 shadow-md">
                                        <FileType2 size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#2d342b] mb-1 line-clamp-1">{file.name}</h3>
                                    <p className="text-sm text-[#5a6157]">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={onClose}
                                disabled={isImporting}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all bg-[#f8faf2] text-[#5a6157] hover:bg-[#e4eade]"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitImport}
                                disabled={!file || isImporting}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all bg-[#41683f] text-white hover:bg-[#355c34] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#41683f]/20"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Import File
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
