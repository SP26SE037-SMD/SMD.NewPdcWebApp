"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TaskItem, TaskService } from "@/services/task.service";
import { RequestService } from "@/services/request.service";
import { Major, MajorService } from "@/services/major.service";
import { CurriculumFramework, CurriculumService } from "@/services/curriculum.service";
import { Subject, SubjectService } from "@/services/subject.service";
import { SprintItem, SprintService } from "@/services/sprint.service";
import { AccountService } from "@/services/account.service";

interface RequestsWorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "HoCFDC" | "HoPDC" | "VP";
  user: any;
  requests: any[];
  onSuccess: () => void;
}

export default function RequestsWorkspaceCreateModal({
  isOpen,
  onClose,
  role,
  user,
  requests,
  onSuccess,
}: RequestsWorkspaceCreateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumFramework[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingCurriculums, setLoadingCurriculums] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "Finalize Task & Recheck Subject",
    content: "",
    comment: "",
    status: "PENDING",
    type: role === "HoPDC" ? "TASK" : "MAJOR",
    targetId: "",
    receivedById: "",
    majorId: "",
    curriculumId: "",
  });

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sprints, setSprints] = useState<SprintItem[]>([]);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);

  // Fetch majors on mount
  useEffect(() => {
    if (isOpen && (role === "HoCFDC" || role === "VP")) {
      fetchMajors();
    }
  }, [isOpen, role]);

  // Sync types and call resolvers
  useEffect(() => {
    if (!isOpen) return;

    if (createForm.type === "TASK") {
      fetchTasksOptions();
    } else if (createForm.type === "SUBJECT") {
      fetchSubjectsOptions();
    } else if (createForm.type === "SPRINT") {
      fetchSprintsOptions();
    } else if (createForm.type === "MAJOR") {
      fetchMajors();
    } else if (createForm.type === "CURRICULUM") {
      fetchMajors();
    }
  }, [createForm.type, isOpen]);

  // Resolve receiver
  useEffect(() => {
    if (!isOpen) return;
    resolveReceiver();
  }, [isOpen]);

  const resolveReceiver = async () => {
    if (!user) return;
    if (role === "HoPDC") {
      // 1. Try to find HOCFDC from currently loaded requests list where user is the receiver
      const foundRequest = requests.find(
        (r) => r.createdBy?.accountId && r.createdBy.accountId !== user.accountId
      );
      const hocfdcAccountId = foundRequest?.createdBy?.accountId;
      if (hocfdcAccountId) {
        setCreateForm((prev) => ({
          ...prev,
          receivedById: hocfdcAccountId,
        }));
        return;
      }

      // 2. Query API for requests received by this user to find the HOCFDC sender
      try {
        const res = await RequestService.getRequests({
          receivedById: user.accountId,
          size: 10,
        });
        const list = res?.data?.content || [];
        const found = list.find(
          (r) => r.createdBy?.accountId && r.createdBy.accountId !== user.accountId
        );
        const hocfdcAccountIdFromQuery = found?.createdBy?.accountId;
        if (hocfdcAccountIdFromQuery) {
          setCreateForm((prev) => ({
            ...prev,
            receivedById: hocfdcAccountIdFromQuery,
          }));
          return;
        }
      } catch (err) {
        console.error("Failed to query requests for HoCFDC receiver", err);
      }

      // 3. Fallback: Scan all departments for the HOCFDC role
      try {
        const deptsRes = await SubjectService.getDepartments({ size: 100 });
        const depts = deptsRes.data?.content || [];
        for (const dept of depts) {
          const accounts = await AccountService.getAccountsByDepartment(
            dept.departmentId,
          );
          const hocfdc = accounts.find((a) => a.roleName?.toUpperCase() === "HOCFDC");
          if (hocfdc) {
            setCreateForm((prev) => ({ ...prev, receivedById: hocfdc.accountId }));
            break;
          }
        }
      } catch (err) {
        console.error("Failed to resolve HoCFDC receiver via fallback scan", err);
      }
    } else if (role === "HoCFDC") {
      const foundVp = requests.find(
        (r) =>
          r.receivedBy?.role === "VP" ||
          (r.receivedBy?.role as any)?.roleName === "VP",
      );
      if (foundVp?.receivedBy?.accountId) {
        setCreateForm((prev) => ({
          ...prev,
          receivedById: foundVp.receivedBy!.accountId,
        }));
        return;
      }

      try {
        const deptsRes = await SubjectService.getDepartments({ size: 100 });
        const depts = deptsRes.data?.content || [];
        for (const dept of depts) {
          const accounts = await AccountService.getAccountsByDepartment(
            dept.departmentId,
          );
          const vp = accounts.find((a) => a.roleName?.toUpperCase() === "VP");
          if (vp) {
            setCreateForm((prev) => ({ ...prev, receivedById: vp.accountId }));
            break;
          }
        }
      } catch (err) {
        console.error("Failed to scan departments for VP account", err);
      }
    }
  };

  const fetchMajors = async () => {
    if (majors.length > 0) return;
    setLoadingMajors(true);
    try {
      const response = await MajorService.getMajors({ size: 100, page: 0 });
      setMajors(response?.data?.content || []);
    } catch (err) {
      setMajors([]);
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchCurriculumsByMajor = async (majorId: string) => {
    if (!majorId) {
      setCurriculums([]);
      return;
    }
    setLoadingCurriculums(true);
    try {
      const response = (await CurriculumService.getCurriculumsByMajorId(
        majorId,
      )) as any;
      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setCurriculums(items);
    } catch (err) {
      setCurriculums([]);
    } finally {
      setLoadingCurriculums(false);
    }
  };

  const fetchTasksOptions = async () => {
    if (!user?.accountId) return;
    setLoadingTasks(true);
    try {
      const response = await TaskService.getTasks({
        assignTo: user.accountId,
        size: 100,
      });
      setTasks(response.content || []);
    } catch (err) {
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchSubjectsOptions = async () => {
    if (!user?.departmentId) return;
    setLoadingSubjects(true);
    try {
      const response = await SubjectService.getSubjects({
        departmentId: user.departmentId,
        size: 100,
      });
      setSubjects(response.data?.content || []);
    } catch (err) {
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchSprintsOptions = async () => {
    if (!user?.accountId) return;
    setLoadingSprints(true);
    try {
      const response = await SprintService.getSprintsByAccount(user.accountId, {
        size: 100,
      });
      setSprints(response.data?.content || []);
    } catch (err) {
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  const handleMajorChange = async (majorId: string) => {
    setCreateForm((prev) => ({
      ...prev,
      majorId,
      curriculumId: "",
      targetId: "",
    }));
    await fetchCurriculumsByMajor(majorId);
  };

  const handleCreateRequest = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (!createForm.targetId) {
      toast.error("Please select a target");
      return;
    }
    if (!user?.accountId) {
      toast.error("User profile is not ready. Please reload and try again.");
      return;
    }

    setSubmitting(true);
    try {
      if (role === "HoCFDC") {
        await RequestService.createRequestVP({
          title: createForm.title.trim(),
          content: createForm.content.trim(),
          type: createForm.type,
          targetId: createForm.targetId,
        });
      } else {
        await RequestService.createRequestV2({
          title: createForm.title.trim(),
          content: createForm.content.trim(),
          type: createForm.type,
          targetId: createForm.targetId,
          receivedById: createForm.receivedById || null,
        });
      }

      handleCloseModal();
      toast.success("Request created successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setCreateForm({
      title: "Finalize Task & Recheck Subject",
      content: "",
      comment: "",
      status: "PENDING",
      type: role === "HoPDC" ? "TASK" : "MAJOR",
      targetId: "",
      receivedById: "",
      majorId: "",
      curriculumId: "",
    });
    setCurriculums([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseModal}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[10px] border border-zinc-200 bg-white shadow-2xl z-10"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Create New Request
              </h2>
              <p className="text-sm text-zinc-500 font-semibold uppercase tracking-widest mt-1">
                System Change Governance
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-left">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Request Type
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setCreateForm((prev) => ({
                      ...prev,
                      type: newType,
                      targetId: "",
                      majorId: "",
                      curriculumId: "",
                    }));
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  {role === "HoPDC" ? (
                    <>
                      <option value="TASK">Task</option>
                      <option value="SUBJECT">Subject (Not supported yet)</option>
                      <option value="SPRINT">Department Task (Not supported yet)</option>
                    </>
                  ) : (
                    <>
                      <option value="MAJOR">Major</option>
                      <option value="CURRICULUM">Curriculum</option>
                    </>
                  )}
                </select>
              </div>

              {createForm.type === "TASK" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Select Task
                  </label>
                  <select
                    value={createForm.targetId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        targetId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="">
                      {loadingTasks ? "Loading tasks..." : "Select task"}
                    </option>
                    {tasks.map((task) => (
                      <option key={task.taskId} value={task.taskId}>
                        {task.taskName} ({task.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.type === "SUBJECT" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Select Subject
                  </label>
                  <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold text-zinc-500 flex items-center justify-center gap-2">
                    <span>This request type is not supported yet</span>
                  </div>
                </div>
              )}

              {createForm.type === "SPRINT" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Select Department Task
                  </label>
                  <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold text-zinc-500 flex items-center justify-center gap-2">
                    <span>This request type is not supported yet</span>
                  </div>
                </div>
              )}

              {createForm.type === "MAJOR" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Select Major
                  </label>
                  <select
                    value={createForm.targetId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        targetId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="">
                      {loadingMajors ? "Loading majors..." : "Select major"}
                    </option>
                    {majors.map((major) => (
                      <option key={major.majorId} value={major.majorId}>
                        {major.majorCode} - {major.majorName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.type === "CURRICULUM" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Select Major
                    </label>
                    <select
                      value={createForm.majorId}
                      onChange={(e) => handleMajorChange(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="">
                        {loadingMajors
                          ? "Loading majors..."
                          : "Select major"}
                      </option>
                      {majors.map((major) => (
                        <option key={major.majorId} value={major.majorId}>
                          {major.majorCode} - {major.majorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Curriculum Framework
                    </label>
                    <select
                      value={createForm.curriculumId}
                      onChange={(e) => {
                        const currId = e.target.value;
                        setCreateForm((prev) => ({
                          ...prev,
                          curriculumId: currId,
                          targetId: currId,
                        }));
                      }}
                      disabled={!createForm.majorId || loadingCurriculums}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none disabled:opacity-50"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1.25rem",
                      }}
                    >
                      <option value="">
                        {loadingCurriculums
                          ? "Loading curriculums..."
                          : "Select curriculum"}
                      </option>
                      {curriculums.map((curriculum) => (
                        <option
                          key={curriculum.curriculumId}
                          value={curriculum.curriculumId}
                        >
                          {curriculum.curriculumCode} -{" "}
                          {curriculum.curriculumName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Request Title
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Summarize the core request purpose..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Content Detail
                </label>
                <textarea
                  value={createForm.content}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Provide a detailed description of the proposed changes..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-3">
            <button
              onClick={handleCloseModal}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRequest}
              disabled={
                submitting ||
                !createForm.title.trim() ||
                !createForm.content.trim() ||
                !createForm.targetId ||
                createForm.type === "SUBJECT" ||
                createForm.type === "SPRINT"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
