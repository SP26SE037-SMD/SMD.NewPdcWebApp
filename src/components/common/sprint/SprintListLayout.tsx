"use client";

import { Search, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface StatusOption {
  id: string;
  label: string;
}

interface SprintListLayoutProps {
  title: React.ReactNode;
  extraHeader?: React.ReactNode;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  statusOptions: StatusOption[];
  filterType?: "buttons" | "tabs";
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    setPage: (page: number) => void;
  };
  children: React.ReactNode;
  emptyMessage?: string;
  itemCount?: number;
}

export const SprintListLayout = ({
  title,
  extraHeader,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  statusOptions,
  filterType = "buttons",
  isLoading,
  isError,
  errorMessage,
  pagination,
  children,
  emptyMessage = "No sprints found.",
  itemCount = 0,
}: SprintListLayoutProps) => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {title}
        </div>
        {extraHeader}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 border border-zinc-100 shadow-sm rounded-2xl">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by sprint name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-none outline-none font-bold text-sm text-zinc-900 placeholder:text-zinc-300 transition-all rounded-xl"
          />
        </div>

        {filterType === "buttons" && (
          <div className="flex items-center gap-3">
            <div className="flex border border-zinc-100 p-1 bg-zinc-50 rounded-xl overflow-x-auto no-scrollbar">
              {statusOptions.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg whitespace-nowrap outline-none ${
                    statusFilter === status.id
                      ? "bg-[#409b43] text-white shadow-md shadow-[#409b43]/30"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shopee-style Tabs (Optional alternative) */}
      {filterType === "tabs" && (
        <div className="flex border-b border-zinc-100 overflow-x-auto no-scrollbar scroll-smooth">
          {statusOptions.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] relative whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "text-[#409b43] bg-[#409b43]/5 border-[#409b43]"
                    : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#409b43] rounded-t-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-4 min-h-[400px] content-start">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 size={40} className="animate-spin text-zinc-200" />
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              Synchronizing Registry...
            </p>
          </div>
        ) : isError ? (
          <div className="py-32 text-center space-y-4 border-2 border-rose-100 bg-rose-50/30 rounded-xl">
            <AlertCircle size={48} className="mx-auto text-rose-200" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-rose-400 uppercase tracking-tight">
                API Connection Error
              </h3>
              <p className="text-sm font-medium text-rose-300">
                {errorMessage || "Failed to fetch sprints"}
              </p>
            </div>
          </div>
        ) : itemCount > 0 ? (
          <>
            <div className="space-y-4">
              {children}
            </div>

            {/* Pagination UI */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-4 pt-12 items-stretch">
                <button
                  disabled={pagination.page === 0}
                  onClick={() => pagination.setPage(pagination.page - 1)}
                  className="px-6 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 font-black text-[10px] uppercase tracking-widest disabled:opacity-30 rounded-xl transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center font-black text-sm px-6 bg-zinc-900 text-white rounded-xl shadow-md">
                  {pagination.page + 1} / {pagination.totalPages}
                </div>
                <button
                  disabled={pagination.page >= pagination.totalPages - 1}
                  onClick={() => pagination.setPage(pagination.page + 1)}
                  className="px-6 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 font-black text-[10px] uppercase tracking-widest disabled:opacity-30 rounded-xl transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center space-y-4 border-2 border-dashed border-zinc-200 bg-zinc-50/50 rounded-none">
            <AlertCircle size={48} className="mx-auto text-zinc-200" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-zinc-400 uppercase tracking-tight">
                {emptyMessage}
              </h3>
              <p className="text-sm font-medium text-zinc-300">
                Try adjusting your filters or search keywords.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
