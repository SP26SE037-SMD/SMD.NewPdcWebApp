"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Plus, Target, GraduationCap, Loader2, Building2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SprintService, SprintPayload, SPRINT_STATUS } from "@/services/sprint.service";
import { SubjectService } from "@/services/subject.service";
import { AccountService } from "@/services/account.service";
import { CurriculumService } from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculumId: string;
}

export const CreateSprintModal = ({ isOpen, onClose, curriculumId }: CreateSprintModalProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  // Fetch Curriculum Details for metadata display
  const { data: currRes, isLoading: isLoadingCurr } = useQuery({
    queryKey: ["curriculum-details", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId),
    enabled: isOpen && !!curriculumId
  });
  const curriculum = currRes?.data;
  
  const [formData, setFormData] = useState<Omit<SprintPayload, 'departmentId'>>({
    sprintName: "",
    startDate: "",
    endDate: "",
    status: SPRINT_STATUS.PLANNING,
    curriculumId: curriculumId
  });

  // Fetch Departments filtered by Curriculum
  const { data: deptsRes } = useQuery({
    queryKey: ["departments-by-curriculum", curriculumId],
    queryFn: () => CurriculumGroupSubjectService.getDepartmentsByCurriculum(curriculumId),
    enabled: isOpen && !!curriculumId
  });
  const depts = (deptsRes?.data as any) || []; // API returns unique list of departments
 
  // Auto-generate Sprint Name based on Curriculum and Department
  useEffect(() => {
    if (curriculum) {
      const deptsList = (deptsRes?.data as any) || [];
      const dept = deptsList.find((d: any) => d.departmentId === selectedDeptId);
      const deptCode = dept ? dept.departmentCode : "";
      const prefix = curriculum.curriculumCode;
      const newName = deptCode ? `${prefix} - ${deptCode}` : `${prefix} - `;
      
      setFormData(prev => {
        if (prev.sprintName === newName) return prev;
        return {
          ...prev,
          sprintName: newName
        };
      });
    }
  }, [curriculum, selectedDeptId, deptsRes?.data]);

  const createMutation = useMutation({
    mutationFn: (data: SprintPayload) => SprintService.createSprint(data),
    onSuccess: (response) => {
      if (response.status === 1000) {
        showToast("Sprint created successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["sprints"] });
        router.refresh(); // Revalidate the path to update server components
        onClose();
        // Reset form
        setFormData({
          sprintName: "",
          startDate: "",
          endDate: "",
          status: SPRINT_STATUS.PLANNING,
          curriculumId: curriculumId
        });
        setSelectedDeptId("");
      } else {
        showToast(response.message || "Failed to create sprint", "error");
      }
    },
    onError: (error: any) => {
      showToast(error.message || "An error occurred while creating the sprint", "error");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sprintName.trim()) {
      showToast("Sprint name is required", "warning");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      showToast("Start and end dates are required", "warning");
      return;
    }

    if (!selectedDeptId) {
      showToast("Please select a department for this sprint", "warning");
      return;
    }

    // Basic date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(formData.startDate);
    
    if (start < today) {
      showToast("Start date cannot be in the past", "error");
      return;
    }

    if (new Date(formData.endDate) <= start) {
      showToast("End date must be after start date", "error");
      return;
    }

    const payload: SprintPayload = {
      ...formData,
      departmentId: selectedDeptId,
      curriculumId,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString()
    };

    createMutation.mutate(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-white/40 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white border border-zinc-100 shadow-2xl overflow-hidden rounded-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-zinc-100 bg-zinc-50/50">
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-primary tracking-tighter uppercase">Create Sprint</h2>
                 <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <GraduationCap size={14} className="text-primary"/> 
                        {isLoadingCurr ? (
                            <span className="animate-pulse">Loading Framework Identity...</span>
                        ) : curriculum ? (
                            <span className="flex items-center gap-2">
                                <span className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[9px]">{curriculum.curriculumCode}</span>
                                <span className="text-zinc-600 truncate max-w-[300px]">{curriculum.curriculumName}</span>
                            </span>
                        ) : (
                            "Define Academic Timeline & Objectives"
                        )}
                    </p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white border border-zinc-200 text-zinc-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all rounded-lg shadow-sm active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form className="p-10 space-y-10" onSubmit={handleSubmit}>
               <div className="space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Target size={14} className="text-primary" /> Sprint Name / Campaign
                     </label>
                     <input 
                       type="text" 
                       required
                       value={formData.sprintName}
                       onChange={(e) => setFormData(prev => ({ ...prev, sprintName: e.target.value }))}
                       placeholder="e.g. IT_K18_FALL_2026"
                       className="w-full bg-zinc-50 border border-zinc-200 p-4 font-black text-zinc-900 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all outline-none text-xl tracking-tight rounded-xl"
                     />
                  </div>

                   <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={14} className="text-primary" /> Academic Department (Sprint Owner)
                         </label>
                         <select
                           required
                           value={selectedDeptId}
                           onChange={(e) => setSelectedDeptId(e.target.value)}
                           className="w-full bg-zinc-50 border border-zinc-200 p-4 font-black text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl text-lg shadow-sm"
                         >
                           <option value="">Select Department...</option>
                           {depts.map((d: any) => (
                             <option key={d.departmentId} value={d.departmentId}>
                               {d.departmentName} ({d.departmentCode})
                             </option>
                           ))}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Start Date
                         </label>
                         <input 
                           type="date" 
                           required
                           value={formData.startDate}
                           onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                           className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> End Date
                         </label>
                         <input 
                           type="date" 
                           required
                           value={formData.endDate}
                           onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                           className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
                         />
                      </div>
                   </div>
               </div>

               <div className="flex items-center gap-6 pt-6 border-t border-zinc-100">
                  <div className="flex-1 p-4 bg-sky-50 rounded-lg border-l-4 border-sky-400">
                     <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest mb-1">Status: {formData.status}</p>
                     <p className="text-xs text-sky-600 font-medium leading-relaxed">
                        Newly created sprints default to Planning status.
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <button 
                       type="button"
                       onClick={onClose}
                       className="px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
                     >
                        Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={createMutation.isPending}
                       className="flex items-center gap-2 bg-primary text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {createMutation.isPending ? (
                          <>Saving <Loader2 size={16} className="animate-spin" /></>
                        ) : (
                          <>Save <Plus size={16} strokeWidth={3} /></>
                        )}
                     </button>
                   </div>
               </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
