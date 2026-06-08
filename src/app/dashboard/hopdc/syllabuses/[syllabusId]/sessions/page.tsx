"use client";

import React, { use, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setSessions } from "@/store/slices/syllabusSlice";
import { Loader2, CalendarDays, Eye } from "lucide-react";
import { SessionService, SessionItem } from "@/services/session.service";
import { SyllabusService } from "@/services/syllabus.service";
import { RegulationService } from "@/services/regulation.service";
import { CloPloService } from "@/services/cloplo.service";
import { MappingService, CloSessionMapping } from "@/services/mapping.service";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { SessionMappingTab } from "./_components/SessionMappingTab";

export default function SessionsPage({
  params,
}: {
  params: Promise<{ syllabusId: string }>;
}) {
  const { syllabusId } = use(params);
  const isReadOnly = true;
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  // Fetch Syllabus
  const { data: syllabusData, isLoading: isSyllabusLoading } = useQuery({
    queryKey: ["syllabus", syllabusId],
    queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
    enabled: !!syllabusId,
  });

  // Fetch Regulations for Recommended limits
  const { data: regulationsData, isLoading: isRegLoading } = useQuery({
    queryKey: ["regulations"],
    queryFn: () => RegulationService.getRegulations(),
  });

  // Fetch Sessions list
  const {
    data: sessionDataRes,
    isLoading: isSessionLoading,
    isFetching: isFetchingSessions,
  } = useQuery({
    queryKey: ["sessions", syllabusId],
    queryFn: () =>
      syllabusId
        ? SessionService.getSessions(syllabusId, 0, 100)
        : Promise.reject("No syllabusId"),
    enabled: !!syllabusId,
  });

  const reduxSessions = useSelector((state: RootState) =>
    syllabusId ? state.syllabus.sessionsDB[syllabusId] : undefined,
  );

  // Sync API data to Redux slice
  useEffect(() => {
    if (
      !isSessionLoading &&
      !isFetchingSessions &&
      !isRegLoading &&
      !isSyllabusLoading &&
      syllabusId &&
      syllabusData?.data
    ) {
      const rawData = sessionDataRes?.data as any;
      const apiSessions: any[] = Array.isArray(rawData?.content)
        ? rawData.content
        : [];

      const finalSessions: SessionItem[] = apiSessions
        .map((apiSess) => {
          const selectionStates: any[] = [];
          const materialMap: Record<string, any> = {};

          apiSess.material?.forEach((m: any) => {
            materialMap[m.materialId] = {
              materialId: m.materialId,
              materialTitle: m.materialName || "Chapter",
              blockIds: [],
              blockNames: [],
            };
          });

          apiSess.block?.forEach((b: any) => {
            const firstMatId = apiSess.material?.[0]?.materialId;
            if (firstMatId && materialMap[firstMatId]) {
              materialMap[firstMatId].blockIds.push(b.blockId);
              const bName =
                b.blockName || b.contentText || b.content || "Selected";
              materialMap[firstMatId].blockNames.push(bName);
            }
          });

          Object.values(materialMap).forEach((val) =>
            selectionStates.push(val),
          );

          return {
            sessionId: apiSess.session || apiSess.sessionId,
            syllabusId,
            sessionNumber: apiSess.sessionNumber,
            sessionTitle: apiSess.sessionTitle,
            teachingMethods: apiSess.teachingMethods,
            duration: apiSess.duration,
            content: JSON.stringify(selectionStates),
            cloIds: apiSess.cloIds || [],
            sessionTopic: apiSess.sessionTopic || "",
          };
        })
        .sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

      dispatch(setSessions({ syllabusId, sessions: finalSessions }));
    }
  }, [
    isSessionLoading,
    isFetchingSessions,
    isRegLoading,
    isSyllabusLoading,
    sessionDataRes,
    syllabusId,
    dispatch,
    regulationsData,
    syllabusData,
  ]);

  const regs = regulationsData?.data?.content || [];
  const rl1 = regs.find((r: any) => r.code === "RL1")?.value || 50;
  const rl2 = regs.find((r: any) => r.code === "RL2")?.value || 15;
  const recommendedMax = Math.ceil(
    ((syllabusData?.data?.credit || syllabusData?.data?.noCredit || 0) *
      rl2 *
      60) /
      rl1,
  );

  const sessions = reduxSessions || [];
  const isLoading = isSessionLoading || isRegLoading || isSyllabusLoading;

  const subjectId = syllabusData?.data?.subjectId;
  const { data: closRes } = useQuery({
    queryKey: ["clos", subjectId],
    queryFn: () =>
      subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
    enabled: !!subjectId,
  });
  const clos = closRes?.data?.content || [];

  const [activeTab, setActiveTab] = useState<"list" | "mapping">("list");
  const [mappingStates, setMappingStates] = useState<Record<string, string[]>>(
    {},
  );
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const { data: mappingsRes } = useQuery({
    queryKey: ["session-mappings", syllabusId],
    queryFn: () =>
      syllabusId ? MappingService.getSyllabusSessionMappings(syllabusId) : null,
    enabled: !!syllabusId,
  });

  // Populate CLO mapping state for reference display
  useEffect(() => {
    if (activeTab === "mapping" && sessions.length > 0) {
      const newStates = { ...mappingStates };

      if (mappingsRes?.data) {
        const apiMappings = mappingsRes.data;
        const grouped: Record<string, string[]> = {};
        apiMappings.forEach((m: CloSessionMapping) => {
          if (!grouped[m.sessionId]) grouped[m.sessionId] = [];
          grouped[m.sessionId].push(m.cloId);
        });

        sessions.forEach((sess) => {
          if (sess.sessionId) {
            newStates[sess.sessionId] = grouped[sess.sessionId] || [];
          }
        });
      } else {
        sessions.forEach((sess) => {
          const sId = sess.sessionId;
          if (sId && !newStates[sId]) {
            newStates[sId] = sess.cloIds || [];
          }
        });
      }
      setMappingStates(newStates);
    }
  }, [activeTab, sessions, mappingsRes?.data]);

  if (!syllabusId) return null;

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2
          size={32}
          className="animate-spin mb-4"
          style={{ color: "#41683f" }}
        />
        <p className="font-medium" style={{ color: "#5a6157" }}>
          Loading sessions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ── Page Header ── */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div>
          <h1
            className="text-3xl font-extrabold text-on-surface tracking-tight mb-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Sessions
          </h1>
          <p className="text-[12px] font-bold text-zinc-900 flex items-center gap-2">
            <span>{sessions.length} sessions created</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
            <span>Recommended max: {recommendedMax} sessions</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
            <span>
              {syllabusData?.data?.credit || syllabusData?.data?.noCredit || 0}{" "}
              credits
            </span>
          </p>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex border-b border-outline-variant/30 mb-8 mt-4">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-8 py-3 font-bold text-sm transition-all relative ${activeTab === "list" ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
        >
          Session List
          {activeTab === "list" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>
          )}
        </button>
        <button
          onClick={() => {
            if (sessions.length === 0) {
              showToast(
                "Please create sessions first before mapping CLOs",
                "info",
              );
              return;
            }
            setActiveTab("mapping");
          }}
          className={`px-8 py-3 font-bold text-sm transition-all relative ${sessions.length === 0 ? "opacity-50 cursor-not-allowed" : ""} ${activeTab === "mapping" ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
        >
          CLO Mapping
          {activeTab === "mapping" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>
          )}
        </button>
      </div>

      <div className={activeTab === "list" ? "block" : "hidden"}>
        <>
          {/* ── Empty State ── */}
          {sessions.length === 0 && !isLoading && (
            <div
              className="text-center py-24 rounded-2xl"
              style={{ background: "#ffffff", border: "2px dashed #adb4a8" }}
            >
              <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
                <CalendarDays size={48} />
              </div>
              <h3
                className="font-bold mt-4 mb-2"
                style={{
                  color: "#5a6157",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
              >
                No Sessions Found
              </h3>
              <p className="text-sm mb-6" style={{ color: "#adb4a8" }}>
                This syllabus currently has no sessions.
              </p>
            </div>
          )}

          {/* ── Editorial Table ── */}
          {sessions.length > 0 && (
            <div className="space-y-6">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant/10">
                <div className="col-span-1">No.</div>
                <div className="col-span-3">Session Title</div>
                <div className="col-span-6">Session Topic</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Scrollable Sessions List Container */}
              <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {sessions.map((session, index) => (
                  <div
                    key={session.sessionId || `local-${index}`}
                    className="grid grid-cols-12 items-center px-6 py-3 bg-surface-container-lowest rounded-xl hover:shadow-lg hover:shadow-on-surface/5 transition-all group border border-transparent hover:border-primary/10"
                  >
                    <div
                      className="col-span-1 font-black text-sm"
                      style={{ color: "#adb4a8" }}
                    >
                      {session.sessionNumber}
                    </div>
                    <div className="col-span-3">
                      <h4
                        className="text-sm font-black leading-tight uppercase tracking-tight"
                        style={{
                          color: "#2d342b",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                        }}
                      >
                        {session.sessionTitle ||
                          `Session ${session.sessionNumber}`}
                      </h4>
                      <div
                        className="flex items-center gap-2 mt-1"
                        style={{ color: "#5a6157" }}
                      >
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[9px] font-black uppercase tracking-widest">
                          {session.teachingMethods || "Lecture"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          • {session.duration || 50} MIN
                        </span>
                      </div>
                    </div>
                    <div className="col-span-6 pr-8">
                      {session.sessionTopic ? (
                        <p
                          className="text-sm line-clamp-3"
                          style={{ color: "rgba(90,97,87,0.8)" }}
                        >
                          {session.sessionTopic}
                        </p>
                      ) : (
                        <p
                          className="text-sm italic"
                          style={{ color: "#adb4a8" }}
                        >
                          No topic assigned yet.
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingIndex(index)}
                        className="h-8 px-2 flex items-center justify-center rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200"
                        title="View Session"
                      >
                        <Eye size={13} strokeWidth={2.5} className="mr-1" />
                        <span className="text-[10px] font-bold">View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      </div>

      <div className={activeTab === "mapping" ? "block" : "hidden"}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SessionMappingTab
            sessions={sessions}
            subjectClos={clos}
            mappingStates={mappingStates}
            onMappingChange={(sessionId, cloIds) =>
              setMappingStates((prev) => ({ ...prev, [sessionId]: cloIds }))
            }
          />
        </div>
      </div>

      {/* ── Session Detail View Modal ── */}
      {viewingIndex !== null && sessions[viewingIndex] && (
        <SessionDetailModal
          isOpen={viewingIndex !== null}
          onClose={() => setViewingIndex(null)}
          session={sessions[viewingIndex] as any}
          subjectId={subjectId}
        />
      )}
    </div>
  );
}
