"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckSquare,
  Clock,
  MoreVertical,
  Filter,
  AlertCircle,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  
  const tabs = [
    { id: "ALL", label: "All Tasks" },
    { id: "TO_DO", label: "To Do" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "DONE", label: "Done" },
    { id: "REVISION_REQUESTED", label: "Revision Requested" },
    { id: "CANCELLED", label: "Cancelled" }
  ];

  // Placeholder mock data
  const [tasks] = useState([
    {
      id: "TASK-001",
      title: "Review Syllabus for SWE102",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: "2026-04-25",
      assignee: "You"
    },
    {
      id: "TASK-002",
      title: "Approve Curriculum Structure - IT 2026",
      status: "TO_DO",
      priority: "MEDIUM",
      dueDate: "2026-05-01",
      assignee: "You"
    },
    {
      id: "TASK-003",
      title: "Upload Pre-requisites Mapping",
      status: "DONE",
      priority: "LOW",
      dueDate: "2026-04-10",
      assignee: "You"
    },
    {
      id: "TASK-004",
      title: "Fix Math 101 References",
      status: "REVISION_REQUESTED",
      priority: "HIGH",
      dueDate: "2026-04-12",
      assignee: "You"
    },
    {
      id: "TASK-005",
      title: "Deprecated Physics Module",
      status: "CANCELLED",
      priority: "LOW",
      dueDate: "2026-04-05",
      assignee: "You"
    },
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          task.id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "ALL" || task.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Tasks
          </h1>
          <p className="text-on-surface-variant mt-2 text-base max-w-xl">
            Streamline your workflow. Manage and track all curriculum and syllabus evaluations seamlessly.
          </p>
        </div>
      </motion.div>

      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.15 }}
         className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
         {tabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
               ${activeTab === tab.id 
                 ? 'bg-primary text-on-primary shadow-md shadow-primary/20' 
                 : 'bg-surface hover:bg-surface-container border border-outline/20 text-on-surface-variant'
               }`}
           >
             {tab.label}
             <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-black/10">
               {tab.id === "ALL" ? tasks.length : tasks.filter(t => t.status === tab.id).length}
             </span>
           </button>
         ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border border-outline/20 bg-surface/40 p-2 shadow-xl shadow-black/5 backdrop-blur-2xl"
      >
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-lowest/50">
              <tr className="border-b border-outline/20">
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Task ID</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Title</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Status</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Priority</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Due Date</th>
                <th className="p-5 font-semibold text-center text-on-surface-variant uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, idx) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group border-b border-outline/10 transition-all hover:bg-surface-container-lowest/80"
                    >
                      <td className="p-5 font-bold text-on-surface/80">{task.id}</td>
                      <td className="p-5">
                        <span className="font-semibold text-on-surface text-base group-hover:text-primary transition-colors">
                          {task.title}
                        </span>
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide
                          ${task.status === 'IN_PROGRESS' ? 'bg-secondary/10 text-secondary' 
                          : task.status === 'DONE' ? 'bg-primary/10 text-primary'
                          : task.status === 'TO_DO' ? 'bg-surface-container-highest text-on-surface-variant' 
                          : task.status === 'REVISION_REQUESTED' ? 'bg-error/10 text-error'
                          : 'bg-outline/10 text-on-surface-variant line-through opacity-70'}`}
                        >
                          {task.status === 'DONE' && <CheckCircle2 className="h-3 w-3" />}
                          {task.status === 'IN_PROGRESS' && <Clock className="h-3 w-3" />}
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 font-medium
                          ${task.priority === 'HIGH' ? 'text-error' : 
                            task.priority === 'MEDIUM' ? 'text-secondary' : 'text-primary'}`}
                        >
                          {task.priority === 'HIGH' && <AlertCircle className="h-4 w-4" />}
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-5 text-on-surface-variant">
                         <div className="flex w-max items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-1 border border-outline/10">
                            <CalendarDays className="w-4 h-4 text-primary/70" />
                            <span className="font-medium whitespace-nowrap">{task.dueDate}</span>
                         </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center">
                          <button className="rounded-xl p-2 text-on-surface-variant opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-container-highest hover:text-on-surface cursor-pointer ring-0">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-on-surface-variant bg-surface-container-lowest/30">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <CheckSquare className="h-10 w-10 text-outline" />
                        <p className="text-lg font-medium">No tasks found</p>
                        <p className="text-sm opacity-70">You're all caught up for now.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}