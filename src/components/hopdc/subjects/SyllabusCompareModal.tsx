"use client";

import React, { useState, useMemo } from "react";
import { X, Check, ArrowRight, ShieldAlert, AlertTriangle, FileText, CalendarDays, ClipboardCheck, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SyllabusService, CompareResult } from "@/services/syllabus.service";
import { MaterialTextCompareModal } from './MaterialTextCompareModal';
import { MaterialService, MaterialItem } from "@/services/material.service";
import { SessionService, SessionItem } from "@/services/session.service";
import { AssessmentService, AssessmentItem } from "@/services/assessment.service";
import { DiffMaterials } from "./DiffMaterials";
import { DiffSessions } from "./DiffSessions";
import { DiffAssessments } from "./DiffAssessments";
interface SyllabusCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldSyllabusId: string;
  newSyllabusId: string;
  oldSyllabusName: string;
  newSyllabusName: string;
}

type TabType = 'summary' | 'materials' | 'sessions' | 'assessments';

export default function SyllabusCompareModal({
  isOpen,
  onClose,
  oldSyllabusId,
  newSyllabusId,
  oldSyllabusName,
  newSyllabusName,
}: SyllabusCompareModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [comparingMaterial, setComparingMaterial] = useState<{ oldId?: string, newId?: string, title: string } | null>(null);

  // AI Summary
  const { data: response, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ["compare-syllabus", oldSyllabusId, newSyllabusId],
    queryFn: () => SyllabusService.compareSyllabus(oldSyllabusId, newSyllabusId),
    enabled: isOpen && !!oldSyllabusId && !!newSyllabusId,
  });

  // Materials
  const { data: oldMaterialsRes, isLoading: isOldMatLoading } = useQuery({ queryKey: ["materials", oldSyllabusId], queryFn: () => MaterialService.getMaterialsBySyllabusId(oldSyllabusId), enabled: isOpen && !!oldSyllabusId });
  const { data: newMaterialsRes, isLoading: isNewMatLoading } = useQuery({ queryKey: ["materials", newSyllabusId], queryFn: () => MaterialService.getMaterialsBySyllabusId(newSyllabusId), enabled: isOpen && !!newSyllabusId });

  // Sessions
  const { data: oldSessionsRes, isLoading: isOldSesLoading } = useQuery({ queryKey: ["sessions", oldSyllabusId], queryFn: () => SessionService.getSessions(oldSyllabusId, 0, 100), enabled: isOpen && !!oldSyllabusId });
  const { data: newSessionsRes, isLoading: isNewSesLoading } = useQuery({ queryKey: ["sessions", newSyllabusId], queryFn: () => SessionService.getSessions(newSyllabusId, 0, 100), enabled: isOpen && !!newSyllabusId });

  // Assessments
  const { data: oldAssessmentsRes, isLoading: isOldAssLoading } = useQuery({ queryKey: ["assessments", oldSyllabusId], queryFn: () => AssessmentService.getAssessmentsBySyllabusId(oldSyllabusId), enabled: isOpen && !!oldSyllabusId });
  const { data: newAssessmentsRes, isLoading: isNewAssLoading } = useQuery({ queryKey: ["assessments", newSyllabusId], queryFn: () => AssessmentService.getAssessmentsBySyllabusId(newSyllabusId), enabled: isOpen && !!newSyllabusId });

  const compareResult: CompareResult | undefined = (response?.data as any)?.comparisonResult;

  const isLoading = isSummaryLoading || isOldMatLoading || isNewMatLoading || isOldSesLoading || isNewSesLoading || isOldAssLoading || isNewAssLoading;

  // Diff Calculations
  const extractItems = (res: any) => {
    if (!res) return [];
    
    const possibleArrays = [
      res,
      res.data,
      res.content,
      res.data?.data,
      res.data?.content,
      res.data?.data?.content
    ];

    for (const arr of possibleArrays) {
      if (Array.isArray(arr)) {
        return arr;
      }
    }
    return [];
  };

  const materialPairs = useMemo(() => {
    const oldMats: MaterialItem[] = extractItems(oldMaterialsRes);
    const newMats: MaterialItem[] = extractItems(newMaterialsRes);

    const matched = new Set<string>();
    const pairs: { old: MaterialItem | null, new: MaterialItem | null, status: 'ADDED' | 'REMOVED' | 'UNCHANGED' }[] = [];

    // Find matches and removed
    oldMats.forEach(oldItem => {
      const match = newMats.find(newItem => newItem.title === oldItem.title && !matched.has(newItem.title));
      if (match) {
        matched.add(match.title);
        pairs.push({ old: oldItem, new: match, status: 'UNCHANGED' });
      } else {
        pairs.push({ old: oldItem, new: null, status: 'REMOVED' });
      }
    });

    // Find added
    newMats.forEach(newItem => {
      if (!matched.has(newItem.title)) {
        pairs.push({ old: null, new: newItem, status: 'ADDED' });
      }
    });
    return pairs;
  }, [oldMaterialsRes, newMaterialsRes]);

  const sessionPairs = useMemo(() => {
    const oldSess: SessionItem[] = extractItems(oldSessionsRes);
    const newSess: SessionItem[] = extractItems(newSessionsRes);

    const matched = new Set<number>();
    const pairs: { old: SessionItem | null, new: SessionItem | null, status: 'ADDED' | 'REMOVED' | 'UNCHANGED' | 'MODIFIED' }[] = [];

    oldSess.forEach(oldItem => {
      const match = newSess.find(newItem => newItem.sessionNumber === oldItem.sessionNumber && !matched.has(newItem.sessionNumber!));
      if (match) {
        matched.add(match.sessionNumber!);
        const isModified = oldItem.sessionTitle !== match.sessionTitle || oldItem.sessionTopic !== match.sessionTopic;
        pairs.push({ old: oldItem, new: match, status: isModified ? 'MODIFIED' : 'UNCHANGED' });
      } else {
        pairs.push({ old: oldItem, new: null, status: 'REMOVED' });
      }
    });

    newSess.forEach(newItem => {
      if (!matched.has(newItem.sessionNumber!)) {
        pairs.push({ old: null, new: newItem, status: 'ADDED' });
      }
    });

    return pairs.sort((a, b) => {
      const aNum = a.old?.sessionNumber || a.new?.sessionNumber || 0;
      const bNum = b.old?.sessionNumber || b.new?.sessionNumber || 0;
      return aNum - bNum;
    });
  }, [oldSessionsRes, newSessionsRes]);

  const assessmentPairs = useMemo(() => {
    const oldAss: AssessmentItem[] = extractItems(oldAssessmentsRes);
    const newAss: AssessmentItem[] = extractItems(newAssessmentsRes);

    const matched = new Set<string>();
    const pairs: { old: AssessmentItem | null, new: AssessmentItem | null, status: 'ADDED' | 'REMOVED' | 'UNCHANGED' | 'MODIFIED' }[] = [];

    oldAss.forEach(oldItem => {
      const key = `${oldItem.categoryName}-${oldItem.part}`;
      const match = newAss.find(newItem => `${newItem.categoryName}-${newItem.part}` === key && !matched.has(key));
      if (match) {
        matched.add(key);
        const isModified = oldItem.weight !== match.weight || oldItem.completionCriteria !== match.completionCriteria;
        pairs.push({ old: oldItem, new: match, status: isModified ? 'MODIFIED' : 'UNCHANGED' });
      } else {
        pairs.push({ old: oldItem, new: null, status: 'REMOVED' });
      }
    });

    newAss.forEach(newItem => {
      const key = `${newItem.categoryName}-${newItem.part}`;
      if (!matched.has(key)) {
        pairs.push({ old: null, new: newItem, status: 'ADDED' });
      }
    });

    return pairs.sort((a, b) => {
      const aPart = a.old?.part || a.new?.part || 0;
      const bPart = b.old?.part || b.new?.part || 0;
      return aPart - bPart;
    });
  }, [oldAssessmentsRes, newAssessmentsRes]);


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {comparingMaterial && (
            <MaterialTextCompareModal
              oldId={comparingMaterial.oldId}
              newId={comparingMaterial.newId}
              title={comparingMaterial.title}
              onClose={() => setComparingMaterial(null)}
            />
          )}

          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                Syllabus Comparison Diff
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="font-semibold text-zinc-500 line-clamp-1 max-w-xs">{oldSyllabusName}</span>
                <ArrowRight size={14} className="text-zinc-300 flex-shrink-0" />
                <span className="font-semibold text-primary line-clamp-1 max-w-xs">{newSyllabusName}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 px-6 pt-2 shrink-0 bg-white">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            >
              <AlignLeft size={16} /> Summary
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            >
              <FileText size={16} /> Materials
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sessions' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            >
              <CalendarDays size={16} /> Sessions
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assessments' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            >
              <ClipboardCheck size={16} /> Assessments
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative no-scrollbar">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 z-10 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-4 animate-pulse">
                  Analyzing Differences...
                </p>
              </div>
            ) : null}

            {activeTab === 'summary' && (
              isSummaryError ? (
                <div className="py-20 text-center">
                  <AlertTriangle size={48} className="mx-auto text-rose-500 mb-4 opacity-50" />
                  <p className="text-lg font-bold text-zinc-900">Comparison Failed</p>
                  <p className="text-sm text-zinc-500 mt-2">Could not analyze differences between these two syllabuses.</p>
                </div>
              ) : compareResult ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {/* Concepts Changes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Added Concepts
                      </h3>
                      <ul className="space-y-3">
                        {compareResult.added_concepts?.length > 0 ? (
                          compareResult.added_concepts.map((concept, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm font-medium text-emerald-900">
                              <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                              {concept}
                            </li>
                          ))
                        ) : (
                          <p className="text-xs text-emerald-600/50 italic">No concepts added</p>
                        )}
                      </ul>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5">
                      <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Removed Concepts
                      </h3>
                      <ul className="space-y-3">
                        {compareResult.removed_concepts?.length > 0 ? (
                          compareResult.removed_concepts.map((concept, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm font-medium text-rose-900 line-through decoration-rose-300">
                              <X size={16} className="text-rose-400 mt-0.5 shrink-0" />
                              {concept}
                            </li>
                          ))
                        ) : (
                          <p className="text-xs text-rose-600/50 italic">No concepts removed</p>
                        )}
                      </ul>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Modified Concepts
                      </h3>
                      <ul className="space-y-3">
                        {compareResult.modified_concepts?.length > 0 ? (
                          compareResult.modified_concepts.map((concept, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm font-medium text-blue-900">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              {concept}
                            </li>
                          ))
                        ) : (
                          <p className="text-xs text-blue-600/50 italic">No concepts modified</p>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 relative overflow-hidden">
                    <ShieldAlert className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10" strokeWidth={1} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                      <ShieldAlert size={16} className="text-amber-500" />
                      Risk Assessment: {compareResult.risk_assessment}
                    </h3>
                    <div className="bg-white/60 rounded-xl p-4 border border-amber-100 relative z-10 mt-4">
                      <p className="text-sm text-amber-900 font-medium leading-relaxed">
                        {compareResult.risk_reason}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null
            )}

            {/* Split View Components */}
            {activeTab !== 'summary' && (
              <div className="flex h-full gap-4 animate-in fade-in duration-500 w-[200%] md:w-full">
                {/* Left: Old */}
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col w-full md:w-1/2 min-w-[500px]">
                  <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 font-bold text-zinc-700 text-sm flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                        Old Syllabus
                    </div>
                    <span className="text-zinc-500 font-medium truncate max-w-[200px] bg-white px-3 py-1 rounded-full border border-zinc-200 text-xs shadow-sm">{oldSyllabusName}</span>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'materials' && (
                      <DiffMaterials 
                        materials={materialPairs.map(p => ({ item: p.old, pairedItem: p.new, status: p.status === 'REMOVED' ? 'REMOVED' : 'UNCHANGED' }))} 
                        syllabusId={oldSyllabusId} 
                        viewMode="list"
                        isOldSide={true}
                        onMaterialClick={(oldId, newId, title) => setComparingMaterial({ oldId, newId, title: title || '' })}
                      />
                    )}
                    {activeTab === 'sessions' && (
                      <DiffSessions 
                        sessions={sessionPairs.map(p => ({ item: p.old, status: p.status === 'REMOVED' ? 'REMOVED' : p.status === 'MODIFIED' ? 'MODIFIED' : 'UNCHANGED' }))} 
                      />
                    )}
                    {activeTab === 'assessments' && (
                      <DiffAssessments 
                        assessments={assessmentPairs.map(p => ({ item: p.old, status: p.status === 'REMOVED' ? 'REMOVED' : p.status === 'MODIFIED' ? 'MODIFIED' : 'UNCHANGED' }))} 
                      />
                    )}
                  </div>
                </div>

                {/* Right: New */}
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col w-full md:w-1/2 min-w-[500px]">
                  <div className="bg-[#f2f8ec] px-6 py-4 border-b border-[#c1eeba]/40 font-bold text-[#345a32] text-sm flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        New Syllabus
                    </div>
                    <span className="text-primary font-medium truncate max-w-[200px] bg-white px-3 py-1 rounded-full border border-primary/20 text-xs shadow-sm">{newSyllabusName}</span>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'materials' && (
                      <DiffMaterials 
                        materials={materialPairs.map(p => ({ item: p.new, pairedItem: p.old, status: p.status === 'ADDED' ? 'ADDED' : 'UNCHANGED' }))} 
                        syllabusId={newSyllabusId} 
                        viewMode="list"
                        isOldSide={false}
                        onMaterialClick={(oldId, newId, title) => setComparingMaterial({ oldId, newId, title: title || '' })}
                      />
                    )}
                    {activeTab === 'sessions' && (
                      <DiffSessions 
                        sessions={sessionPairs.map(p => ({ item: p.new, status: p.status === 'ADDED' ? 'ADDED' : p.status === 'MODIFIED' ? 'MODIFIED' : 'UNCHANGED' }))} 
                      />
                    )}
                    {activeTab === 'assessments' && (
                      <DiffAssessments 
                        assessments={assessmentPairs.map(p => ({ item: p.new, status: p.status === 'ADDED' ? 'ADDED' : p.status === 'MODIFIED' ? 'MODIFIED' : 'UNCHANGED' }))} 
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
