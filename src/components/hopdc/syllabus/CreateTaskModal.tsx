import React, { useState, useRef, useEffect } from "react";
import { X, User, Search, Plus, Clock, Lock, Paperclip } from "lucide-react";
import { DepartmentAccount } from "../../../services/account.service";
import { CreateTaskPayload } from "../../../services/task.service";

interface Syllabus {
  syllabusId: string;
  syllabusName: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<CreateTaskPayload>) => void;
  accounts: DepartmentAccount[];
  syllabi: Syllabus[];
}

export const CreateTaskModal = ({
  isOpen,
  onClose,
  onCreate,
  accounts,
  syllabi,
}: CreateTaskModalProps) => {
  const [taskData, setTaskData] = useState<Partial<CreateTaskPayload>>({
    taskName: "",
    description: "",
    priority: "MEDIUM",
    deadline: new Date().toISOString().split("T")[0],
    type: "TASK",
    accountId: "",
    syllabusId: "",
  });

  const [searchAssignee, setSearchAssignee] = useState("");
  const [showAssigneeList, setShowAssigneeList] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeRef.current &&
        !assigneeRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredAccounts = accounts
    .filter((acc) => acc.roleName === "PDCM")
    .filter((acc) =>
      acc.fullName.toLowerCase().includes(searchAssignee.toLowerCase()),
    );

  const selectedAccount = accounts.find(
    (a) => a.accountId === taskData.accountId,
  );

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 my-auto">
        {/* Header */}
        <div className="relative pt-12 pb-6 px-12 text-center">
          <button
            onClick={onClose}
            className="absolute right-8 top-8 p-2 hover:bg-zinc-100 rounded-full transition-colors group"
          >
            <X size={20} className="text-zinc-400 group-hover:text-zinc-600" />
          </button>
          <h2 className="text-3xl font-black text-zinc-800 tracking-tight">
            New task
          </h2>
        </div>

        {/* Body */}
        <div className="px-12 pb-12">
          <div className="flex flex-col gap-8">
            {/* Subject and Status Row */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <input
                  autoFocus
                  placeholder="Subject"
                  className="w-full text-xl font-bold text-zinc-800 placeholder:text-zinc-300 border-2 border-zinc-100 rounded-2xl px-6 py-4 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                  value={taskData.taskName}
                  onChange={(e) =>
                    setTaskData({ ...taskData, taskName: e.target.value })
                  }
                />
              </div>
              <div className="shrink-0 pt-2">
                <div className="relative group">
                  <select
                    className="appearance-none bg-[#6B728E] text-white font-bold text-sm px-6 py-2.5 pr-10 rounded-xl hover:bg-[#5B627E] transition-all cursor-pointer outline-none shadow-lg shadow-zinc-200 border-none"
                    value={(taskData as any).status}
                    onChange={(e) =>
                      setTaskData({ ...taskData, status: e.target.value } as any)
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="TO_DO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Plus size={14} className="text-white/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags and Assignee Row */}
            <div className="flex items-start justify-between gap-8">
              <div className="flex flex-col gap-6 flex-1">
                {/* Syllabus Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Syllabus
                  </span>
                  <select
                    className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl px-5 py-3 text-sm font-bold text-zinc-700 focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition-all cursor-pointer"
                    value={taskData.syllabusId}
                    onChange={(e) =>
                      setTaskData({ ...taskData, syllabusId: e.target.value })
                    }
                  >
                    <option value="">Select syllabus...</option>
                    {syllabi.map((s) => (
                      <option key={s.syllabusId} value={s.syllabusId}>
                        {s.syllabusName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag/Type Button */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Task Type
                  </span>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100">
                      <Plus size={14} />
                      <span>Add tag</span>
                    </button>
                    {taskData.type && (
                      <input
                        className="bg-zinc-50 border-none focus:ring-0 text-sm font-bold text-zinc-700 rounded-xl px-4 py-2 w-32"
                        value={taskData.type}
                        onChange={(e) =>
                          setTaskData({ ...taskData, type: e.target.value })
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Assignee Section */}
              <div className="shrink-0 w-48 pt-6">
                <div className="relative" ref={assigneeRef}>
                  <div
                    onClick={() => setShowAssigneeList(!showAssigneeList)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:border-emerald-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all overflow-hidden shadow-inner">
                      {selectedAccount ? (
                        <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-700 text-2xl font-black">
                          {selectedAccount.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <User size={32} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
                        Assign{" "}
                        <span className="font-normal text-zinc-400 ml-1">
                          or
                        </span>
                      </p>
                      <p className="text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
                        Assign to me
                      </p>
                    </div>
                  </div>

                  {showAssigneeList && (
                    <div className="absolute top-full right-0 z-100 mt-4 w-64 bg-white rounded-3xl border border-zinc-100 shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 px-3 py-3 border-b border-zinc-50">
                        <Search size={14} className="text-zinc-400" />
                        <input
                          autoFocus
                          placeholder="Search PDCM..."
                          className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium"
                          value={searchAssignee}
                          onChange={(e) => setSearchAssignee(e.target.value)}
                        />
                      </div>
                      <div className="mt-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {filteredAccounts.map((acc) => (
                          <div
                            key={acc.accountId}
                            onClick={() => {
                              setTaskData({
                                ...taskData,
                                accountId: acc.accountId,
                              });
                              setShowAssigneeList(false);
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-emerald-50 cursor-pointer transition-all group"
                          >
                            <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 text-[11px] font-black group-hover:bg-white transition-colors">
                              {acc.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-zinc-700 group-hover:text-emerald-700">
                              {acc.fullName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="relative">
              <textarea
                placeholder="Please add descriptive text to help others better understand this task"
                className="w-full min-h-50 bg-white border-2 border-zinc-100 rounded-[28px] px-8 py-8 text-sm font-medium text-zinc-700 placeholder:text-zinc-300 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition-all resize-none shadow-sm"
                value={taskData.description}
                onChange={(e) =>
                  setTaskData({ ...taskData, description: e.target.value })
                }
              />

              {/* Floating Tool Icons */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                <button className="p-3 bg-zinc-50 text-emerald-500 rounded-2xl hover:bg-emerald-50 transition-all shadow-sm">
                  <Clock size={20} strokeWidth={2.5} />
                </button>
                <button className="p-3 bg-zinc-50 text-cyan-500 rounded-2xl hover:bg-cyan-50 transition-all shadow-sm">
                  <Search size={20} strokeWidth={2.5} />
                </button>
                <button className="p-3 bg-zinc-50 text-zinc-400 rounded-2xl hover:bg-zinc-100 transition-all shadow-sm">
                  <Lock size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Priority Row */}
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                Priority
              </span>
              <div className="flex gap-2">
                {["LOW", "MEDIUM", "HIGH"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setTaskData({ ...taskData, priority: p })}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${
                      taskData.priority === p
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#76e8d4]/20 rounded-xl flex items-center justify-center text-[#76e8d4]">
                    <Paperclip size={20} />
                  </div>
                  <span className="text-sm font-bold text-zinc-700 tracking-tight">
                    0 Attachments
                  </span>
                </div>
                <button className="h-10 w-10 bg-[#76e8d4] text-white rounded-xl flex items-center justify-center hover:bg-[#66d8c4] transition-all shadow-lg shadow-emerald-100">
                  <Plus size={20} />
                </button>
              </div>
              <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50/50">
                <p className="text-sm font-bold text-zinc-300">
                  Drop attachments here!
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                onClick={() => {
                  if (
                    !taskData.taskName ||
                    !taskData.accountId ||
                    !taskData.syllabusId
                  ) {
                    alert("Please fill in Subject, Assignee and Syllabus");
                    return;
                  }
                  onCreate(taskData);
                }}
                className="w-full bg-[#76e8d4] text-zinc-800 font-black text-sm py-5 rounded-3xl hover:bg-[#66d8c4] hover:-translate-y-1 active:translate-y-0 transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
