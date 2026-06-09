"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Settings,
  Search,
  AlertCircle as AlertCircleIcon,
  CheckCircle2,
  Rocket,
  Clock,
} from "lucide-react";
import { SYLLABUS_STATUS } from "@/services/syllabus.service";

export const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
  // Normalize DB status strings to handle "in progress" -> "IN_PROGRESS" mismatches
  const normalizedStatus = (currentStatus || "DRAFT")
    .toUpperCase()
    .replace(/\s+/g, "_");

  // Determine dynamic state
  const isPublished = normalizedStatus === SYLLABUS_STATUS.PUBLISHED;
  const isApproved = normalizedStatus === SYLLABUS_STATUS.APPROVED || isPublished;

  // Dynamically build the 4 steps representing the logical lifecycle
  const steps = [
    {
      id: SYLLABUS_STATUS.DRAFT,
      label: "Draft",
      icon: FileText,
      color: "#94a3b8",
    },
    {
      id: SYLLABUS_STATUS.IN_PROGRESS,
      label: "In Progress",
      icon: Settings,
      color: "#3b82f6",
    },
    {
      id: SYLLABUS_STATUS.PENDING_REVIEW,
      label: "Pending Review",
      icon: Search,
      color: "#f59e0b",
    },
    {
      id: SYLLABUS_STATUS.PUBLISHED,
      label: "Accepted",
      icon: CheckCircle2,
      color: "#06b6d4",
    },
  ];

  // Determine the active index based on current status
  let activeIdx = 0; // Default is Draft
  if (normalizedStatus === SYLLABUS_STATUS.IN_PROGRESS) {
    activeIdx = 1;
  } else if (
    normalizedStatus === SYLLABUS_STATUS.PENDING_REVIEW ||
    normalizedStatus === "REVIEWING"
  ) {
    activeIdx = 2;
  } else if (isApproved) {
    activeIdx = 3;
  }

  return (
    <div className="flex items-center justify-between w-full px-4 py-6">
      {steps.map((statusItem, idx) => {
        const isActive = idx === activeIdx;
        const isCompleted = idx < activeIdx;
        const Icon = statusItem.icon;

        // Use standard colors based on state
        const stateColor = isCompleted 
          ? "#10b981" // Emerald for completed
          : isActive 
            ? "#3b82f6" // Blue for active
            : "#e4e4e7"; // Zinc for pending

        return (
          <div key={statusItem.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-3 relative">
              {/* Circle Wrapper */}
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  isActive
                    ? "shadow-lg shadow-blue-100 scale-110 border-blue-200"
                    : isCompleted
                      ? "border-emerald-200"
                      : "border-zinc-100"
                }`}
                style={{
                  backgroundColor: isCompleted || isActive ? stateColor : "white",
                  color: isCompleted || isActive ? "white" : "#a1a1aa",
                }}
              >
                <Icon size={18} className={isActive ? "animate-pulse" : ""} />
              </div>

              {/* Label */}
              <div className="absolute -bottom-8 flex flex-col items-center">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap transition-colors duration-300 ${
                    isActive 
                      ? "text-blue-600" 
                      : isCompleted 
                        ? "text-emerald-600" 
                        : "text-zinc-400"
                  }`}
                >
                  {statusItem.label}
                </span>
              </div>
            </div>

            {/* Connecting Line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] bg-zinc-100 mx-4 rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: isCompleted ? "100%" : "0%",
                    backgroundColor: "#10b981",
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="h-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
