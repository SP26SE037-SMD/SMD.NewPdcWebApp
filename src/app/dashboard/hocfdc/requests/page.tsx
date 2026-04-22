"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ClipboardList,
  Clock,
  MoreVertical,
  Filter,
  CheckCircle2,
  XCircle,
  CalendarDays
} from "lucide-react";

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  
  const tabs = [
    { id: "ALL", label: "All Requests" },
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" }
  ];

  // Placeholder mock data
  const [requests] = useState([
    {
      id: "REQ-001",
      title: "Request to Update SWE102 Prerequisite",
      status: "PENDING",
      type: "SUBJECT_UPDATE",
      date: "2026-04-20",
    },
    {
      id: "REQ-002",
      title: "New Syllabus Creation: AI305",
      status: "APPROVED",
      type: "SYLLABUS_CREATION",
      date: "2026-04-18",
    },
    {
      id: "REQ-003",
      title: "Curriculum Change - SE 2024",
      status: "REJECTED",
      type: "CURRICULUM_MODIFICATION",
      date: "2026-04-15",
    },
    {
      id: "REQ-004",
      title: "Update Math 101 Book",
      status: "PENDING",
      type: "MATERIAL_UPDATE",
      date: "2026-04-21",
    },
  ]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(search.toLowerCase()) || 
                          req.id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "ALL" || req.status === activeTab;
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
            Requests
          </h1>
          <p className="text-on-surface-variant mt-2 text-base max-w-xl">
            Monitor, approve, and manage all change requests submitted across your departments seamlessly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95">
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <ClipboardList className="h-4 w-4" />
            <span>New Request</span>
          </button>
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
             <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-black/10 text-inherit">
               {tab.id === "ALL" ? requests.length : requests.filter(r => r.status === tab.id).length}
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
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Request ID</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Title</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Type</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs">Status</th>
                <th className="p-5 font-semibold text-on-surface-variant uppercase tracking-wider text-xs whitespace-nowrap">Date Submitted</th>
                <th className="p-5 font-semibold text-center text-on-surface-variant uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req, idx) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group border-b border-outline/10 transition-all hover:bg-surface-container-lowest/80"
                    >
                      <td className="p-5 font-bold text-on-surface/80">{req.id}</td>
                      <td className="p-5">
                        <span className="font-semibold text-on-surface text-base group-hover:text-primary transition-colors">
                          {req.title}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center rounded-lg bg-surface-container-highest/50 px-2.5 py-1 text-xs font-medium text-on-surface-variant border border-outline/10">
                          {req.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide
                          ${req.status === 'PENDING' ? 'bg-secondary-container text-on-secondary-container' 
                          : req.status === 'APPROVED' ? 'bg-primary/10 text-primary' 
                          : 'bg-error/10 text-error'}`}
                        >
                          {req.status === 'PENDING' && <Clock className="h-3 w-3" />}
                          {req.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                          {req.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                          {req.status}
                        </span>
                      </td>
                      <td className="p-5 text-on-surface-variant">
                         <div className="flex w-max items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-1 border border-outline/10">
                            <CalendarDays className="w-4 h-4 text-primary/70" />
                            <span className="font-medium whitespace-nowrap">{req.date}</span>
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
                        <ClipboardList className="h-10 w-10 text-outline" />
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm opacity-70">No pending requests at the moment.</p>
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