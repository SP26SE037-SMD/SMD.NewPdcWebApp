"use client";
 
import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
 
type ToastType = "success" | "error" | "info" | "warning";
 
interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
 
interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}
 
const ToastContext = createContext<ToastContextType | undefined>(undefined);
 
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
 
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);
 
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
 
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
 
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
 
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);
 
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };
 
  const bgStyles = {
    success: "border-emerald-100 bg-white",
    error: "border-rose-100 bg-white",
    warning: "border-amber-100 bg-white",
    info: "border-blue-100 bg-white",
  };
 
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`pointer-events-auto relative flex items-center gap-4 min-w-[350px] p-5 rounded-2xl border ${bgStyles[toast.type]} shadow-[0_20px_50px_rgba(0,0,0,0.1)] group overflow-hidden`}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="text-[13px] font-black text-zinc-900 leading-tight uppercase tracking-tight">
          {toast.type === "error" ? "System Alert" : "Institutional Update"}
        </p>
        <p className="text-[13px] font-medium text-zinc-600 mt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all opacity-0 group-hover:opacity-100"
      >
        <X size={16} />
      </button>
      
      {/* Progress Duration Bar */}
      <motion.div 
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: "linear" }}
        className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${
            toast.type === "success" ? "bg-emerald-500/20" : 
            toast.type === "error" ? "bg-rose-500/20" : 
            "bg-zinc-500/10"
        }`}
      />
    </motion.div>
  );
}
