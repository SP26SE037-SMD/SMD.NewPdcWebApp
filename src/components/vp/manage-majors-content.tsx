"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Plus,
  Search,
  MoreHorizontal,
  User,
  ChevronDown,
  SearchIcon,
  Loader2,
  X,
  History,
  LayoutGrid,
  Users,
  Settings,
  Eye,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MajorService,
  Major,
  CreateMajorPayload,
} from "@/services/major.service";
import { CurriculumService } from "@/services/curriculum.service";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/Toast";
import { useMemo, useEffect } from "react";

export default function ManageMajorsContent() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Instituional");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  // Create Modal State
  const [newMajor, setNewMajor] = useState<CreateMajorPayload>({
    majorCode: "",
    majorName: "",
    description: "",
  });
  const [createError, setCreateError] = useState("");

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch Majors
  const { data: majorResponse, isLoading: isMajorsLoading } = useQuery({
    queryKey: ["majors", search, selectedStatus],
    queryFn: () => MajorService.getMajors({ search, status: selectedStatus }),
  });

  // Fetch all Curriculums to count them per major
  const { data: curriculumResponse, isLoading: isCurriculumsLoading } =
    useQuery({
      queryKey: ["all-curriculums-counts"],
      queryFn: () => CurriculumService.getCurriculums({ size: 1000 }), // Large size to get all for counting
    });

  const majors = majorResponse?.data?.content || [];
  const curriculumsList = curriculumResponse?.data?.content || [];

  // Calculate counts per major code
  const curriculumCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    curriculumsList.forEach((curr) => {
      const code = curr.major?.majorCode || curr.majorCode;
      if (code) {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [curriculumsList]);

  const isLoading = isMajorsLoading;

  // Create Major Mutation
  const createMutation = useMutation({
    mutationFn: MajorService.createMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setIsCreateModalOpen(false);
      setNewMajor({ majorCode: "", majorName: "", description: "" });
      setCreateError("");
      showToast("Major established successfully.", "success");
    },
    onError: (error: any) => {
      setCreateError(error.message || "Failed to create major");
      showToast(error.message || "Failed to establish major.", "error");
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      MajorService.updateMajorStatus(id, status),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast(
        `Major status updated to ${response.data.status.replace("_", " ")}.`,
        "success",
      );
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update major status.", "error");
    },
  });

  // Delete Major Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => MajorService.deleteMajor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast("Major deleted permanently.", "success");
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to delete major.", "error");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete the major "${name}"? This action cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newMajor);
  };

  const handleOpenDetail = (code: string) => {
    router.push(
      `/dashboard/vice-principal/manage-majors/${encodeURIComponent(code)}`,
    );
  };

  // Filter mapping
  const statusTabs = [
    { label: "All Programs", value: "" },
    { label: "Active", value: "PUBLISHED" },
    { label: "In Review", value: "INTERNAL_REVIEW" },
    { label: "Draft", value: "DRAFT" },
  ];

  const filteredMajors = useMemo(() => {
    return majors.filter((m) => {
      const matchesSearch = search
        ? m.majorCode.toLowerCase().includes(search.toLowerCase()) ||
          m.majorName.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStatus = selectedStatus ? m.status === selectedStatus : true;
      return matchesSearch && matchesStatus;
    });
  }, [majors, search, selectedStatus]);

  const kpis = {
    totalActive: majors.filter((m) => m.status === "PUBLISHED").length,
    underReview: majors.filter((m) => m.status === "INTERNAL_REVIEW").length,
    complianceRate: "94.2%",
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2d3335]">
      {isCreateModalOpen ? (
        <div className="max-w-6xl mx-auto pt-12 pb-12 px-6">
          {/* Breadcrumbs & Header */}
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-[#5a6062] mb-4">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Curriculum
              </span>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="text-[#4caf50] font-medium">Create Major</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#2d3335] mb-2 font-['Plus_Jakarta_Sans']">
              Define Academic Major
            </h1>
          </div>

          {/* 1. Horizontal Progress Stepper */}
          <div className="mb-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4caf50] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <span className="text-sm font-bold text-[#2d3335]">
                Major Identity
              </span>
            </div>
            <div className="h-[2px] grow bg-[#e5e7eb] mx-4"></div>
            <div className="flex items-center gap-3 opacity-40">
              <div className="w-8 h-8 rounded-full bg-[#f1f4f5] text-[#5a6062] flex items-center justify-center font-bold text-sm border-2 border-[#adb3b5]">
                2
              </div>
              <span className="text-sm font-medium text-[#5a6062]">
                Program Outcomes
              </span>
            </div>
            <div className="h-[2px] grow bg-[#e5e7eb] mx-4"></div>
            <div className="flex items-center gap-3 opacity-40">
              <div className="w-8 h-8 rounded-full bg-[#f1f4f5] text-[#5a6062] flex items-center justify-center font-bold text-sm border-2 border-[#adb3b5]">
                3
              </div>
              <span className="text-sm font-medium text-[#5a6062]">
                Faculty Assignment
              </span>
            </div>
            <div className="h-[2px] grow bg-[#e5e7eb] mx-4"></div>
            <div className="flex items-center gap-3 opacity-40">
              <div className="w-8 h-8 rounded-full bg-[#f1f4f5] text-[#5a6062] flex items-center justify-center font-bold text-sm border-2 border-[#adb3b5]">
                4
              </div>
              <span className="text-sm font-medium text-[#5a6062]">
                Review & Publish
              </span>
            </div>
          </div>

          {/* 2. Horizontal Tabs */}
          <div className="mb-8 border-b border-[#adb3b5]/30 flex gap-8">
            <button className="pb-4 border-b-2 border-[#4caf50] text-[#4caf50] font-bold text-sm">
              Basic Info
            </button>
            <button className="pb-4 border-b-2 border-transparent text-[#5a6062] hover:text-[#2d3335] transition-colors font-medium text-sm">
              Program Outcomes
            </button>
            <button className="pb-4 border-b-2 border-transparent text-[#5a6062] hover:text-[#2d3335] transition-colors font-medium text-sm">
              Faculty
            </button>
            <button className="pb-4 border-b-2 border-transparent text-[#5a6062] hover:text-[#2d3335] transition-colors font-medium text-sm">
              Meta
            </button>
          </div>

          <form
            onSubmit={handleCreateSubmit}
            className="grid grid-cols-12 gap-8 items-start"
          >
            {/* Main Content Area: Tab content for 'Basic Info' */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="bg-white rounded-xl p-8 border border-[#adb3b5]/10 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-[#4caf50] p-2 bg-[#e8f5e9] rounded-lg">
                    edit_note
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-[#2d3335] leading-tight font-['Plus_Jakarta_Sans']">
                      Basic Program Information
                    </h2>
                    <p className="text-sm text-[#5a6062]">
                      Provide the foundational identification details for the
                      new major.
                    </p>
                  </div>
                </div>

                {createError && (
                  <div className="mb-6 p-4 bg-[#fff7f6] text-[#a73b21] text-xs font-bold uppercase tracking-widest rounded-xl border border-[#fd795a]/20">
                    Error: {createError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5a6062] mb-2">
                      Major Code
                    </label>
                    <input
                      required
                      value={newMajor.majorCode}
                      onChange={(e) =>
                        setNewMajor({ ...newMajor, majorCode: e.target.value })
                      }
                      className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-3 text-[#2d3335] placeholder:text-[#adb3b5] transition-all outline-none"
                      placeholder="e.g. CS-2024"
                      type="text"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5a6062] mb-2">
                      Major Name
                    </label>
                    <input
                      required
                      value={newMajor.majorName}
                      onChange={(e) =>
                        setNewMajor({ ...newMajor, majorName: e.target.value })
                      }
                      className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-3 text-[#2d3335] placeholder:text-[#adb3b5] transition-all outline-none"
                      placeholder="e.g. Computer Science"
                      type="text"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5a6062] mb-2">
                    Program Description
                  </label>
                  <textarea
                    required
                    value={newMajor.description}
                    onChange={(e) =>
                      setNewMajor({ ...newMajor, description: e.target.value })
                    }
                    className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-3 text-[#2d3335] placeholder:text-[#adb3b5] transition-all resize-none outline-none"
                    placeholder="Describe the program's vision, philosophy, and primary educational focus..."
                    rows={8}
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3 text-[#5a6062] font-semibold hover:text-[#2d3335] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">close</span>{" "}
                  Cancel
                </button>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="px-6 py-3 border border-[#adb3b5] rounded-xl font-semibold text-[#5a6062] hover:bg-[#f1f4f5] transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-8 py-3 bg-[#4caf50] text-white rounded-xl font-bold shadow-lg shadow-[#4caf50]/20 hover:bg-[#388e3c] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Next: Outcomes{" "}
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Contextual Meta & Progress */}
            <div className="col-span-12 lg:col-span-4 space-y-6 sticky top-24">
              {/* Progress Card */}
              <div className="bg-[#1b5e20] text-white rounded-xl p-6 overflow-hidden relative shadow-lg">
                <div className="relative z-10">
                  <div className="text-[#a5d6a7] text-[10px] font-bold uppercase tracking-widest mb-4">
                    Setup Status
                  </div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="text-3xl font-bold">65%</div>
                    <div className="text-xs text-[#c8e6c9]">
                      2 sections remaining
                    </div>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4caf50] h-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-9xl">
                  analytics
                </span>
              </div>

              {/* Meta Quick View */}
              <div className="bg-white rounded-xl p-6 border border-[#adb3b5]/10 shadow-sm">
                <h3 className="text-sm font-bold text-[#2d3335] mb-4 uppercase tracking-wider">
                  Quick Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#f1f4f5] rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#4caf50] text-sm">
                        visibility
                      </span>
                      <span className="text-xs font-semibold">
                        Public Visibility
                      </span>
                    </div>
                    <div className="w-10 h-5 bg-[#4caf50] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#f1f4f5] rounded-lg">
                    <label className="block text-[10px] font-bold text-[#5a6062] uppercase mb-2">
                      Faculty Association
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-[#d5e8ce] text-[10px] font-medium rounded flex items-center gap-1">
                        Engineering{" "}
                        <span className="material-symbols-outlined text-[10px]">
                          close
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-[10px] font-bold text-[#4caf50]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#5a6062] mt-4 leading-normal italic">
                  Your progress is automatically saved to drafts as you navigate
                  between tabs.
                </p>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-12 max-w-7xl mx-auto space-y-12">
          {/* Page Header */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#2d3335] font-['Plus_Jakarta_Sans']">
                Academic Oversight
              </h1>
              <p className="text-[#5a6062] text-lg max-w-2xl font-medium">
                Executive summary and lifecycle management for active majors and
                institutional accreditation status.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-[#2d6a4f] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#2d6a4f]/10 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} />
              Create New Major
            </button>
          </section>

          {/* KPI Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] flex flex-col justify-between group hover:translate-y-[-2px] transition-transform">
              <div className="flex justify-between items-start">
                <span className="p-2 bg-[#b1f0ce] text-[#1d5c42] rounded-lg">
                  <span className="material-symbols-outlined">menu_book</span>
                </span>
                <span className="text-[#2d6a4f] text-xs font-bold tracking-widest uppercase">
                  Target 42
                </span>
              </div>
              <div className="mt-6">
                <div className="text-4xl font-extrabold tracking-tight">
                  {kpis.totalActive.toString().padStart(2, "0")}
                </div>
                <div className="text-sm font-medium text-[#5a6062] mt-1">
                  Total Active Majors
                </div>
              </div>
              <div className="mt-6 h-1 w-full bg-[#ebeef0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2d6a4f]"
                  style={{ width: `${(kpis.totalActive / 42) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] flex flex-col justify-between group hover:translate-y-[-2px] transition-transform">
              <div className="flex justify-between items-start">
                <span className="p-2 bg-[#fcfeb9] text-[#60622d] rounded-lg">
                  <span className="material-symbols-outlined">rate_review</span>
                </span>
                <span className="text-[#60622d] text-xs font-bold tracking-widest uppercase">
                  Urgent: {kpis.underReview}
                </span>
              </div>
              <div className="mt-6">
                <div className="text-4xl font-extrabold tracking-tight">
                  {kpis.underReview.toString().padStart(2, "0")}
                </div>
                <div className="text-sm font-medium text-[#5a6062] mt-1">
                  Programs Under Review
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-[#fd795a]/20 text-[#a73b21] font-bold rounded">
                  Next Audit: Oct 24
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#2d6a4f] text-white p-8 rounded-2xl shadow-[0px_4px_20px_rgba(45,51,53,0.08)] flex flex-col justify-between relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="material-symbols-outlined text-8xl">
                  verified
                </span>
              </div>
              <div className="flex justify-between items-start relative z-10">
                <span className="p-2 bg-white/20 backdrop-blur rounded-lg">
                  <span className="material-symbols-outlined">analytics</span>
                </span>
              </div>
              <div className="mt-6 relative z-10">
                <div className="text-4xl font-extrabold tracking-tight">
                  {kpis.complianceRate}
                </div>
                <div className="text-sm font-medium text-white/80 mt-1">
                  PO Compliance Rate
                </div>
              </div>
              <div className="mt-6 relative z-10 flex items-center gap-1 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                2.1% from last term
              </div>
            </div>
          </div>

          {/* Major Catalog Section */}
          <section className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Academic Major Catalog
                </h2>
                <p className="text-[#5a6062] text-sm font-medium">
                  Detailed directory of all educational pathways and
                  accreditation cycles.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb3b5]"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search majors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-full text-sm focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all shadow-sm"
                  />
                </div>

                {/* Tabs System */}
                <div className="flex p-1 bg-[#ebeef0] rounded-xl w-full md:w-auto">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                        selectedStatus === tab.value
                          ? "bg-white text-[#1d5c42] shadow-sm"
                          : "text-[#5a6062] hover:text-[#2d3335]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Table Container */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(45,51,53,0.04)] border border-[#ebeef0]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-[#adb3b5]">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p className="font-bold text-xs uppercase tracking-widest text-[#5a6062]">
                    Accessing Institutional Repository...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f1f4f5]/50">
                        <th className="px-8 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest">
                          Major Name
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest text-center">
                          Curriculums
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest text-center">
                          Credits
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest">
                          Last Audit
                        </th>
                        <th className="px-8 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef0]">
                      {filteredMajors.length > 0 ? (
                        filteredMajors.map((major) => (
                          <tr
                            key={major.majorId}
                            className="hover:bg-[#f1f4f5] transition-colors group cursor-pointer"
                            onClick={() => handleOpenDetail(major.majorCode)}
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#dee3e6] flex items-center justify-center text-[#2d6a4f] group-hover:bg-white transition-colors">
                                  <span className="material-symbols-outlined">
                                    {major.majorCode.includes("BIT") ||
                                    major.majorCode.includes("SE")
                                      ? "terminal"
                                      : "architecture"}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-bold text-[#2d3335]">
                                    {major.majorName}
                                  </div>
                                  <div className="text-xs text-[#5a6062] font-medium">
                                    {major.majorCode}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center text-sm font-bold">
                              {curriculumCountsMap[major.majorCode] || 0}
                            </td>
                            <td className="px-6 py-6 text-center text-sm font-medium text-[#5a6062]">
                              -
                            </td>
                            <td className="px-6 py-6">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                  major.status === "PUBLISHED"
                                    ? "bg-[#b1f0ce] text-[#1d5c42]"
                                    : major.status === "INTERNAL_REVIEW"
                                      ? "bg-[#d5e8ce] text-[#465643]"
                                      : major.status === "DRAFT"
                                        ? "bg-[#dee3e6] text-[#5a6062]"
                                        : "bg-[#f1f4f5] text-[#adb3b5]"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    major.status === "PUBLISHED"
                                      ? "bg-[#2d6a4f]"
                                      : major.status === "INTERNAL_REVIEW"
                                        ? "bg-[#53634f]"
                                        : "bg-[#767c7e]"
                                  }`}
                                ></span>
                                {major.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-sm text-[#5a6062] font-medium">
                              {new Date(
                                major.createdAt || Date.now(),
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {major.status === "DRAFT" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(
                                        major.majorId,
                                        major.majorName,
                                      );
                                    }}
                                    className="text-[#a73b21] hover:bg-[#fd795a]/20 p-2 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(major.majorCode);
                                  }}
                                  className="text-[#2d6a4f] hover:bg-[#b1f0ce]/30 p-2 rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined">
                                    more_vert
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-8 py-12 text-center text-[#5a6062] font-medium"
                          >
                            No majors found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer / Pagination fallback */}
              <div className="px-8 py-4 bg-[#f1f4f5]/30 flex items-center justify-between border-t border-[#ebeef0]">
                <div className="text-xs text-[#5a6062] font-medium">
                  Showing {filteredMajors.length} of {majors.length} Majors
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="p-1 rounded hover:bg-[#ebeef0] transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="rotate-90" size={18} />
                  </button>
                  <span className="text-xs font-bold px-2 text-[#2d3335]">
                    Page 1 of 1
                  </span>
                  <button
                    disabled
                    className="p-1 rounded hover:bg-[#ebeef0] transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="-rotate-90" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
