"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ExternalLink, 
  PencilLine, 
  Trash2, 
  MoreVertical, 
  MessageSquare, 
  BarChart3, 
  Layout, 
  Globe, 
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackForm } from "@/services/form.service";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FeedbackFormsTabProps {
  forms: FeedbackForm[];
  majorCode: string;
  curriculums: any[];
  selectedCurrId: string;
  onCurrChange: (id: string) => void;
  onCreateForm: () => void;
  isLoading: boolean;
}

export default function FeedbackFormsTab({
  forms,
  majorCode,
  curriculums,
  selectedCurrId,
  onCurrChange,
  onCreateForm,
  isLoading
}: FeedbackFormsTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT">("ALL");
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());

  // Data filtering logic
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const matchesSearch = form.formType.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           form.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || 
                           (statusFilter === "ACTIVE" && form.isActive) || 
                           (statusFilter === "DRAFT" && !form.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [forms, searchQuery, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedForms.size === filteredForms.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(filteredForms.map(f => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedForms);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForms(next);
  };

  return (
    <div className="space-y-6">
      {/* Professional Header & Stats Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2 uppercase">
            Quản lý Form Phản hồi
          </h2>
          <div className="flex items-center gap-4 text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <ClipboardList size={16} className="text-emerald-600" />
              <span className="text-xs uppercase tracking-widest">
                Đang quản lý {forms.length} form phản hồi cho {majorCode}
              </span>
            </div>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                {forms.filter(f => f.isActive).length} Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="px-5 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
            onClick={() => window.print()}
          >
            <ArrowUpDown size={16} />
            Export Data
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onCreateForm();
            }}
            className="px-6 py-3 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <Plus size={18} strokeWidth={3} />
            Tạo Form Mới
          </button>
        </div>
      </div>

      {/* Toolbar Bento Grid Component */}
      <div className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo loại form, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-indigo-100 text-zinc-600 shadow-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Chỉ Active</option>
              <option value="DRAFT">Chỉ Draft</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Curriculum</span>
            <select 
              value={selectedCurrId}
              onChange={(e) => onCurrChange(e.target.value)}
              className="bg-white border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-indigo-100 text-zinc-600 shadow-sm"
            >
              {curriculums.map((curr) => (
                <option key={curr.curriculumId} value={curr.curriculumId}>
                  {curr.curriculumCode}
                </option>
              ))}
            </select>
          </div>

          <button className="self-end p-3 bg-white text-zinc-400 rounded-xl hover:text-indigo-600 transition-colors shadow-sm border border-transparent hover:border-indigo-100">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Main Professional Data Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-100">
                <th className="px-8 py-5 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedForms.size === filteredForms.length && filteredForms.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Tên & Thông tin Form</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Google Form</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Phân loại</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredForms.length > 0 ? (
                filteredForms.map((form) => (
                  <tr key={form.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        checked={selectedForms.has(form.id)}
                        onChange={() => toggleSelectOne(form.id)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${form.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-zinc-900 text-sm tracking-tight">{form.formType} Form</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">#{form.id.slice(0, 8)}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Created {new Date(form.createdAt).toLocaleDateString()}</span>
                          </div>
                          {/* Tags Area (Mocked for UI/UX demonstration as requested) */}
                          <div className="flex gap-1.5 mt-2">
                             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-tighter rounded-md border border-indigo-100/50">Survey</span>
                             <span className="px-2 py-0.5 bg-zinc-50 text-zinc-500 text-[9px] font-black uppercase tracking-tighter rounded-md border border-zinc-100">Academic</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                        {form.formUrl ? (
                          <div className="flex flex-col gap-1">
                            <a 
                              href={form.formUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1 group/link"
                            >
                              <Layout size={14} className="text-zinc-400" />
                              View Public Form
                              <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                            <a 
                              href={form.formEditUrl || `https://docs.google.com/forms/d/${form.googleFormId}/edit`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              <PencilLine size={12} className="text-zinc-400" />
                              Edit in Google Forms
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-300 italic text-xs font-medium">
                            <Lock size={12} />
                            Google Form Pending...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {/* Classification Badge (Mocked for UI/UX demonstration) */}
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        form.formType === 'GENERAL' 
                          ? 'bg-blue-50 text-blue-600 border-blue-100/50' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                      }`}>
                        {form.formType === 'GENERAL' ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <button 
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${form.isActive ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${form.isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>
                          {form.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity">
                        <Link 
                          href={`/dashboard/hocfdc/manage-majors/${majorCode}/forms/${form.id}/report`}
                          title="View Report"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <BarChart3 size={18} />
                        </Link>
                        <Link 
                          href={`/dashboard/hocfdc/manage-majors/${majorCode}/forms/${form.id}/submissions`}
                          title="View Submissions"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <MessageSquare size={18} />
                        </Link>
                        <Link 
                          href={`/dashboard/hocfdc/manage-majors/${majorCode}/forms/${form.id}`}
                          title="Design Sections"
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Layout size={18} />
                        </Link>
                        <div className="w-px h-6 bg-zinc-100 mx-1" />
                        <button 
                          type="button"
                          title="Delete Form"
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-32 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                      <FileText size={32} className="text-zinc-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Không tìm thấy Form nào</p>
                      <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Thử thay đổi bộ lọc hoặc tạo form mới bên trên</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Professional Footer */}
        <div className="px-8 py-5 bg-zinc-50/50 flex items-center justify-between border-t border-zinc-100">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Showing {filteredForms.length} of {forms.length} total forms
          </span>
          <div className="flex gap-2">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-zinc-400 hover:text-indigo-600 transition-all border border-zinc-100 shadow-sm disabled:opacity-30" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs shadow-md shadow-indigo-100">1</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-zinc-600 font-bold text-xs hover:border-indigo-100 transition-all border border-zinc-100">2</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-zinc-400 hover:text-indigo-600 transition-all border border-zinc-100 shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
