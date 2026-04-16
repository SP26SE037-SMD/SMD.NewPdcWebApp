"use client";

import React, { useState } from 'react';
import {
    UserPlus, X, Search, Mail, CheckCircle2, Users,
    Calendar, AlertCircle, Clock, ArrowRight, Loader2,
    Sparkles, ShieldCheck, ChevronDown, Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface AvailableAccount {
    accountId: string;
    email: string;
    fullName: string;
    avatarUrl: string;
}

interface SyllabusInfo {
    syllabusId: string;
    syllabusName?: string;
    subjectCode?: string;
    curriculumId?: string;
}

interface AssignReviewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    syllabusId: string;
    syllabusInfo?: SyllabusInfo | null;
}

const PRIORITY_OPTIONS = [
    { value: 'HIGH', label: 'High Priority', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { value: 'MEDIUM', label: 'Medium Priority', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { value: 'LOW', label: 'Low Priority', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
] as const;

type PriorityValue = typeof PRIORITY_OPTIONS[number]['value'];

// Date to YYYY-MM-DD string (no time)
function toDateStr(d: Date) {
    return d.toISOString().split('T')[0];
}

// ─── Confirm Step ─────────────────────────────────────────────
function ConfirmStep({
    reviewer, deadline, syllabusName, priority, onBack, onConfirm, isLoading,
}: {
    reviewer: AvailableAccount; deadline: string; syllabusName: string;
    priority: PriorityValue; onBack: () => void; onConfirm: () => void; isLoading: boolean;
}) {
    const p = PRIORITY_OPTIONS.find(o => o.value === priority)!;
    return (
        <motion.div key="confirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#4caf50]/40 flex items-center justify-center mx-auto mb-3 font-black text-2xl shadow-sm text-[#4caf50]">
                    {reviewer.avatarUrl
                        ? <img src={reviewer.avatarUrl} alt={reviewer.fullName} className="w-full h-full rounded-2xl object-cover" />
                        : reviewer.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <p className="font-black text-[#1e293b] text-lg">{reviewer.fullName}</p>
                <p className="text-sm text-[#64748b]">{reviewer.email}</p>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0] space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-[#64748b]">Syllabus</span>
                    <span className="font-bold text-[#1e293b] text-right max-w-[60%] truncate">{syllabusName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#64748b]">Deadline</span>
                    <span className="font-bold text-[#1e293b]">{deadline ? new Date(deadline).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[#64748b]">Priority</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                        style={{ color: p.color, background: p.bg, borderColor: p.border }}>
                        {p.label}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#64748b]">Task Type</span>
                    <span className="px-2 py-0.5 text-[9px] font-black bg-[#e8f5e9] text-[#2e7d32] rounded-md uppercase tracking-wider border border-[#c8e6c9]">
                        SYLLABUS_REVIEW
                    </span>
                </div>
            </div>

            <div className="flex gap-3 pt-1">
                <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-[#e2e8f0] text-[#64748b] font-bold text-sm hover:bg-[#f8fafc] transition-colors">
                    ← Back
                </button>
                <button onClick={onConfirm} disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-white border-2 border-[#4caf50] text-[#4caf50] hover:bg-[#4caf50] hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60">
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {isLoading ? 'Assigning...' : 'Confirm'}
                </button>
            </div>
        </motion.div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────
export function AssignReviewerModal({ isOpen, onClose, syllabusId, syllabusInfo }: AssignReviewerModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<AvailableAccount | null>(null);
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<PriorityValue>('HIGH');
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    // 1. Fetch available accounts for this syllabus
    const { data: accounts = [], isLoading: isAccountsLoading } = useQuery<AvailableAccount[]>({
        queryKey: ['available-accounts', syllabusId],
        queryFn: async () => {
            const res = await fetch(`/api/accounts/department/available-account-ids?syllabusId=${syllabusId}`);
            const json = await res.json();
            return (json?.data || []) as AvailableAccount[];
        },
        enabled: isOpen && !!syllabusId,
    });

    // 2. Fetch sprintId from existing tasks
    const { data: sprintId } = useQuery<string | null>({
        queryKey: ['tasks-sprintId', syllabusId],
        queryFn: async () => {
            const res = await fetch(`/api/tasks?syllabusId=${syllabusId}&size=1`);
            const json = await res.json();
            const content = json?.data?.content;
            return (Array.isArray(content) && content.length > 0) ? content[0].sprintId : null;
        },
        enabled: isOpen && !!syllabusId,
    });

    // 3. Fetch subjectId from syllabus detail
    const { data: subjectId } = useQuery<string | null>({
        queryKey: ['syllabus-detail', syllabusId],
        queryFn: async () => {
            const res = await fetch(`/api/syllabus/${syllabusId}`);
            const json = await res.json();
            return json?.data?.subjectId ?? null;
        },
        enabled: isOpen && !!syllabusId,
    });

    // 3. Create task mutation
    const assignMutation = useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to create task');
            return res.json();
        },
        onSuccess: () => {
            handleClose();
            alert('Review task assigned successfully!');
            router.refresh();
        },
        onError: (err) => {
            console.error('Assignment failed:', err);
            alert('Failed to assign review task. Please try again.');
        },
    });

    const handleConfirm = () => {
        if (!selectedAccount || !syllabusInfo) return;

        const payload = {
            accountId: selectedAccount.accountId,
            subjectId: subjectId || '',
            sprintId: sprintId || '',
            taskName: `Review: ${syllabusInfo.syllabusName}`,
            description: description || `Peer review for syllabus ${syllabusInfo.syllabusName}`,
            priority,
            type: 'SYLLABUS_REVIEW',
        };

        assignMutation.mutate(payload);
    };

    const handleClose = () => {
        setStep('select');
        setSearchTerm('');
        setSelectedAccount(null);
        setDeadline('');
        setDescription('');
        setPriority('HIGH');
        setIsPriorityOpen(false);
        onClose();
    };

    const filteredAccounts = accounts.filter(a =>
        a.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const canProceed = !!selectedAccount && !!deadline;
    const selectedPriority = PRIORITY_OPTIONS.find(o => o.value === priority)!;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                    onClick={handleClose}
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.18)] w-full max-w-lg overflow-hidden"
                    >
                        {/* ── Header ── */}
                        <div className="bg-white border-b border-[#e2e8f0] px-8 pt-8 pb-7 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#4caf50]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-[#4caf50]/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#4caf50]/40 flex items-center justify-center shrink-0 shadow-sm">
                                        <UserPlus size={24} className="text-[#4caf50]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight leading-tight text-[#1e293b]">Assign Cross-Reviewer</h2>
                                        <p className="text-[#64748b] text-[11px] font-medium mt-0.5 truncate max-w-[260px]">
                                            {syllabusInfo?.syllabusName || 'Syllabus Review'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="w-8 h-8 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0 mt-0.5 group/x">
                                    <X size={16} className="text-[#64748b] group-hover/x:text-red-500 transition-colors" />
                                </button>
                            </div>
                            {/* Step indicator */}
                            <div className="relative flex items-center gap-2 mt-5 pt-5 border-t border-[#f1f5f9]">
                                {(['Select Reviewer', 'Confirm'] as const).map((label, i) => (
                                    <React.Fragment key={label}>
                                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                            (step === 'select' && i === 0) || (step === 'confirm' && i === 1) ? 'text-[#4caf50]' : 'text-[#cbd5e1]'
                                        }`}>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all ${
                                                (step === 'select' && i === 0) || (step === 'confirm' && i === 1)
                                                    ? 'border-[#4caf50] bg-[#4caf50] text-white'
                                                    : step === 'confirm' && i === 0 ? 'border-[#4caf50] bg-[#f0fdf4] text-[#4caf50]' : 'border-[#e2e8f0] text-[#cbd5e1]'
                                            }`}>{i === 0 && step === 'confirm' ? '✓' : i + 1}</div>
                                            {label}
                                        </div>
                                        {i === 0 && <div className="flex-1 h-px bg-[#e2e8f0]" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="flex flex-col" style={{ maxHeight: '72vh' }}>
                            <div className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence mode="wait">
                                {step === 'select' ? (
                                    <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                        {/* Search */}
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={15} />
                                            <input type="text" placeholder="Search by name or email..." value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#4caf50] focus:bg-white transition-all placeholder:text-[#cbd5e1]" />
                                        </div>

                                        {/* Accounts list */}
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {isAccountsLoading ? (
                                                <div className="flex flex-col items-center py-10 text-[#94a3b8] gap-2">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <p className="text-xs font-bold">Fetching available reviewers...</p>
                                                </div>
                                            ) : filteredAccounts.length === 0 ? (
                                                <div className="flex flex-col items-center py-10 text-[#94a3b8] gap-2">
                                                    <div className="w-12 h-12 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center">
                                                        <Users size={22} className="text-[#cbd5e1]" />
                                                    </div>
                                                    <p className="font-bold text-sm text-center">No available reviewers</p>
                                                </div>
                                            ) : filteredAccounts.map((account, idx) => {
                                                const isSelected = selectedAccount?.accountId === account.accountId;
                                                const initials = account.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
                                                return (
                                                    <motion.button key={account.accountId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        onClick={() => setSelectedAccount(isSelected ? null : account)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                            isSelected ? 'border-[#4caf50] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#94a3b8] hover:bg-white'
                                                        }`}>
                                                        <div className={`w-10 h-10 rounded-xl font-black text-base flex items-center justify-center shrink-0 transition-all ${
                                                            isSelected ? 'bg-white border-2 border-[#4caf50] text-[#4caf50]' : 'bg-white border border-[#e2e8f0] text-[#1e293b]'
                                                        }`}>
                                                            {account.avatarUrl ? <img src={account.avatarUrl} alt={account.fullName} className="w-full h-full rounded-xl object-cover" /> : initials}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm text-[#1e293b] truncate">{account.fullName}</p>
                                                            <p className="text-[11px] text-[#64748b] flex items-center gap-1 truncate mt-0.5">
                                                                <Mail size={9} className="shrink-0" />{account.email}
                                                            </p>
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={18} className="text-[#4caf50] shrink-0" />}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        {/* Deadline, Priority, Notes */}
                                        <div className="space-y-3 pt-1">
                                            {/* Deadline */}
                                            <div>
                                                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                    <Calendar size={11} /> Review Deadline *
                                                </label>
                                                <input type="date" value={deadline} min={new Date().toISOString().split('T')[0]}
                                                    onChange={e => setDeadline(e.target.value)}
                                                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-bold text-[#1e293b] outline-none focus:border-[#4caf50] focus:bg-white transition-all" />
                                            </div>

                                            {/* Priority dropdown */}
                                            <div>
                                                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                    <Flag size={11} /> Priority *
                                                </label>
                                                <div className="relative">
                                                    <button onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                                                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-bold text-left flex items-center justify-between focus:border-[#4caf50] outline-none transition-all hover:bg-white">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ background: selectedPriority.color }} />
                                                            <span style={{ color: selectedPriority.color }}>{selectedPriority.label}</span>
                                                        </span>
                                                        <ChevronDown size={15} className={`text-[#94a3b8] transition-transform ${isPriorityOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isPriorityOpen && (
                                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                                className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-10 overflow-hidden">
                                                                {PRIORITY_OPTIONS.map(opt => (
                                                                    <button key={opt.value} onClick={() => { setPriority(opt.value); setIsPriorityOpen(false); }}
                                                                        className="w-full px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-[#f8fafc] transition-colors text-left"
                                                                        style={{ color: opt.color }}>
                                                                        <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                                                                        {opt.label}
                                                                        {priority === opt.value && <CheckCircle2 size={13} className="ml-auto" />}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                    <AlertCircle size={11} /> Notes (optional)
                                                </label>
                                                <textarea placeholder="Provide specific instructions..." value={description}
                                                    onChange={e => setDescription(e.target.value)}
                                                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm font-medium text-[#475569] outline-none focus:border-[#4caf50] focus:bg-white transition-all resize-none h-20 placeholder:text-[#cbd5e1]" />
                                            </div>
                                        </div>

                                    </motion.div>
                                ) : (
                                    <ConfirmStep reviewer={selectedAccount!} deadline={deadline} syllabusName={syllabusInfo?.syllabusName || ''} priority={priority}
                                        onBack={() => setStep('select')} onConfirm={handleConfirm} isLoading={assignMutation.isPending} />
                                )}
                            </AnimatePresence>
                            </div>
                            {/* ── Sticky Footer Button (Select step only) ── */}
                            {step === 'select' && (
                                <div className="px-6 pb-6 pt-2 border-t border-[#f1f5f9] bg-white">
                                    <button onClick={() => setStep('confirm')} disabled={!canProceed}
                                        className="w-full py-3.5 rounded-xl bg-white border-2 border-[#4caf50] text-[#4caf50] hover:bg-[#4caf50] hover:text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm">
                                        <Sparkles size={15} className="group-hover:rotate-12 transition-transform" />
                                        Review & Confirm
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
