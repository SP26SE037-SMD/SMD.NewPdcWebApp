"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ReviewTaskService,
  REVIEW_TASK_STATUS,
} from "@/services/review-task.service";
import { SprintService, SPRINT_STATUS } from "@/services/sprint.service";
import { useMemo } from "react";

const C = {
  primary: "#41683f",
  primaryLight: "#f1f4eb",
  surface: "#ffffff",
  onSurface: "#1a1c19",
  onSurfaceVariant: "#5a6157",
  chart: {
    green: "#41683f",
    yellow: "#eab308",
    red: "#ef4444",
    grey: "#9ca3af",
    bg: "#f7f9f2",
  },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return { text: "Good Morning", icon: "wb_sunny" };
  if (hour < 17) return { text: "Good Afternoon", icon: "sunny" };
  if (hour < 21) return { text: "Good Evening", icon: "nightlight" };
  return { text: "Good Night", icon: "dark_mode" };
};

export default function HoPDCDashboardContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const greeting = useMemo(() => getGreeting(), []);

  // Fetch Review Tasks Distribution
  const { data: stats } = useQuery({
    queryKey: ["hopdc-dashboard-stats", user?.accountId],
    queryFn: async () => {
      if (!user?.accountId) return null;
      const [pending, approved, revision] = await Promise.all([
        ReviewTaskService.getReviewTasks(
          user.accountId,
          REVIEW_TASK_STATUS.PENDING,
          0,
          1,
        ),
        ReviewTaskService.getReviewTasks(
          user.accountId,
          REVIEW_TASK_STATUS.APPROVED,
          0,
          1,
        ),
        ReviewTaskService.getReviewTasks(
          user.accountId,
          REVIEW_TASK_STATUS.REVISION_REQUESTED,
          0,
          1,
        ),
      ]);
      return {
        pending: pending.data.totalElements,
        approved: approved.data.totalElements,
        revision: revision.data.totalElements,
      };
    },
    enabled: !!user?.accountId,
  });

  // Fetch Sprint Statuses Distribution (Account-based + Client-side aggregation)
  const { data: sprintStats } = useQuery({
    queryKey: ["hopdc-dashboard-sprint-stats", user?.accountId],
    queryFn: async () => {
      if (!user?.accountId) return null;
      const response = await SprintService.getSprintsByAccount(user.accountId, {
        size: 500,
      });
      const sprints = response.data?.content ?? [];

      // Manual aggregation logic
      const counts = sprints.reduce(
        (acc, s) => {
          const status = s.status as string;
          if (acc[status] !== undefined) acc[status]++;
          return acc;
        },
        {
          [SPRINT_STATUS.PLANNING]: 0,
          [SPRINT_STATUS.IN_PROGRESS]: 0,
          [SPRINT_STATUS.COMPLETED]: 0,
          [SPRINT_STATUS.CANCELLED]: 0,
        } as Record<string, number>,
      );

      return [
        {
          label: "Planning",
          count: counts[SPRINT_STATUS.PLANNING],
          color: C.chart.grey,
        },
        {
          label: "In Progress",
          count: counts[SPRINT_STATUS.IN_PROGRESS],
          color: C.chart.yellow,
        },
        {
          label: "Completed",
          count: counts[SPRINT_STATUS.COMPLETED],
          color: C.chart.green,
        },
        {
          label: "Cancelled",
          count: counts[SPRINT_STATUS.CANCELLED],
          color: C.chart.red,
        },
      ];
    },
    enabled: !!user?.accountId,
  });

  const total =
    (stats?.pending ?? 0) + (stats?.approved ?? 0) + (stats?.revision ?? 0);

  const maxSprintCount = useMemo(() => {
    if (!sprintStats) return 0;
    return Math.max(...sprintStats.map((s) => s.count), 5); // Minimum scale of 5
  }, [sprintStats]);

  return (
    <div
      className="max-w-[1500px] mx-auto h-[calc(100vh-144px)] flex flex-col justify-between gap-8"
      style={{ fontFamily: "var(--font-plus-jakarta)" }}
    >
      {/* Minimalist Header (Clear Background) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#41683f]">
            <span className="material-symbols-outlined text-[20px]">
              {greeting.icon}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              {greeting.text}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#1a1c19] tracking-tight leading-none">
            Hello,{" "}
            <span className="opacity-40">{user?.fullName?.split(" ")[0]}</span>
          </h1>
          <p className="text-[#5a6157] text-base font-medium max-w-xl">
            Institutional overview for the current design cycle. Overall
            curriculum completion is at
            <span className="text-[#41683f] font-bold">
              {" "}
              {total > 0
                ? Math.round(((stats?.approved ?? 0) / total) * 100)
                : 0}
              %
            </span>
            .
          </p>
        </div>
      </motion.div>

      {/* Main Analysis Grid - Flex-1 to fill space */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch flex-1 min-h-0">
        {/* Large Block: Sprint Distribution (Bar Chart) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white p-8 rounded-[3rem] border border-black/5 shadow-sm hover:shadow-xl hover:shadow-[#41683f]/5 transition-all duration-700 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-[#1a1c19] tracking-tight">
                Sprint Distribution
              </h3>
              <p className="text-[10px] font-black text-[#5a6157]/40 uppercase tracking-widest mt-1">
                Operational lifecycle metrics
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#41683f]" />
              <div className="w-2 h-2 rounded-full bg-[#f1f4eb]" />
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="flex-1 w-full relative group flex items-center min-h-0">
            <svg
              viewBox="0 0 700 200"
              className="w-full h-full max-h-[220px] overflow-visible"
            >
              {/* Grid Lines */}
              {[0, 50, 100, 150, 200].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
              ))}

              {/* Bars */}
              {sprintStats?.map((s, i) => {
                const barWidth = 80;
                const spacing = 150;
                const barHeight =
                  maxSprintCount > 0 ? (s.count / maxSprintCount) * 180 : 0;
                const xPos = 100 + i * spacing;

                return (
                  <g key={i}>
                    <motion.rect
                      initial={{ height: 0, y: 200 }}
                      animate={{ height: barHeight, y: 200 - barHeight }}
                      transition={{
                        duration: 1,
                        delay: 0.5 + i * 0.1,
                        ease: "circOut",
                      }}
                      x={xPos - barWidth / 2}
                      width={barWidth}
                      fill={s.color}
                      className="opacity-90 hover:opacity-100 transition-opacity"
                      rx="12"
                    />
                    <motion.text
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 + i * 0.1 }}
                      x={xPos}
                      y={200 - barHeight - 10}
                      textAnchor="middle"
                      className="text-[14px] font-black fill-[#1a1c19]/40"
                    >
                      {s.count}
                    </motion.text>
                    <text
                      x={xPos}
                      y={220}
                      textAnchor="middle"
                      className="text-[10px] font-black fill-[#5a6157]/40 uppercase tracking-widest"
                    >
                      {s.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>

        {/* Small Block: Workload Distribution (Donut Chart) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#1a1c19] text-white p-10 rounded-[3.5rem] relative overflow-hidden flex flex-col justify-between"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight mb-1">
              Workload Distribution
            </h3>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
              Strategy Composition
            </p>
          </div>

          {/* SVG Donut Chart */}
          <div className="relative flex-1 flex items-center justify-center my-4 min-h-0">
            <svg
              viewBox="0 0 100 100"
              className="w-40 h-40 md:w-48 md:h-48 transform -rotate-90"
            >
              {total === 0 ? (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                />
              ) : (
                <>
                  <motion.circle
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: (stats?.pending || 0) / total }}
                    transition={{ duration: 1, delay: 1 }}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                  />
                  <motion.circle
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: (stats?.approved || 0) / total }}
                    transition={{ duration: 1, delay: 1.2 }}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#41683f"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    style={{
                      strokeDashoffset:
                        -251.2 * ((stats?.pending || 0) / total),
                    }}
                  />
                  <motion.circle
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: (stats?.revision || 0) / total }}
                    transition={{ duration: 1, delay: 1.4 }}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    style={{
                      strokeDashoffset:
                        -251.2 *
                        (((stats?.pending || 0) + (stats?.approved || 0)) /
                          total),
                    }}
                  />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black leading-none">{total}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1 text-center">
                Active
                <br />
                Elements
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#41683f]" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                  Approved
                </span>
              </div>
              <p className="text-xl font-black">{stats?.approved ?? 0}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                  Pending
                </span>
              </div>
              <p className="text-xl font-black">{stats?.pending ?? 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Operational Footer - Simplified logic */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between px-8 py-5 rounded-[2rem] bg-[#f7f9f2] border border-black/[0.03]"
      >
        <div className="flex items-center gap-4 text-[#5a6157]">
          <span className="material-symbols-outlined text-[18px] animate-pulse">
            sync_saved_locally
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            System Synchronized with HQ • 2s ago
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard/hopdc/pending-review"
            className="text-[10px] font-black text-[#41683f] uppercase tracking-widest hover:tracking-[0.3em] transition-all"
          >
            Review Queue &rarr;
          </Link>
          <button className="text-[10px] font-black text-[#1a1c19]/40 uppercase tracking-widest hover:text-[#1a1c19] transition-colors">
            Run Diagnostics
          </button>
        </div>
      </motion.div>
    </div>
  );
}
