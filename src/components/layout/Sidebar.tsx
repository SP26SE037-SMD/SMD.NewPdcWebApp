"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { motion } from 'framer-motion';

interface SidebarItem {
    id: string;
    label: string;
    icon: string;
    onClick?: () => void;
    isActive?: boolean;
    isAction?: boolean;
}

interface SidebarProps {
    title?: string;
    subtitle?: string;
    items: SidebarItem[];
    activeId?: string;
    onBack?: () => void;
    actionButton?: React.ReactNode | {
        label: string;
        icon: string;
        onClick: () => void;
    };
    subContent?: React.ReactNode;
}

const C = {
    primary: "#41683f",
    onPrimary: "#eaffe2",
    onSurface: "#2d342b",
    surfaceContainerLow: "#ffffff",
    surfaceContainerLowest: "#ffffff",
    outlineVariant: "#adb4a8",
};

export function Sidebar({ 
    title = "SMD", 
    subtitle, 
    items, 
    activeId, 
    onBack,
    actionButton,
    subContent 
}: SidebarProps) {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <aside className="h-[calc(100vh-64px)] w-64 fixed left-0 top-16 flex flex-col py-6 z-40 bg-[#f8faf9] border-r border-[#f0f2ef] shadow-sm">
            
            {subContent && (
                <div className="px-6 mb-8">
                    {subContent}
                </div>
            )}

            <nav className="flex-1 px-3 space-y-2 mt-4">
                {items.filter(item => !item.isAction).map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 group relative ${
                            item.isActive 
                                ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5' 
                                : 'hover:bg-white/40'
                        }`}
                    >
                        {item.isActive && (
                            <motion.div 
                                layoutId="active-indicator"
                                className="absolute left-0 w-1.5 h-8 bg-[#41683f] rounded-r-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            />
                        )}
                        <span className={`material-symbols-outlined text-[24px] transition-colors ${
                            item.isActive ? 'text-[#41683f]' : 'text-[#5a6157] group-hover:text-[#41683f]'
                        }`}>
                            {item.icon}
                        </span>
                        <span className={`text-[15px] font-bold transition-colors ${
                            item.isActive ? 'text-[#2d342b]' : 'text-[#5a6157] group-hover:text-[#2d342b]'
                        }`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            <div className="mt-auto px-6">
                {/* User Profile Card removed - moved to Header */}

                {React.isValidElement(actionButton) ? (
                    actionButton
                ) : (
                    actionButton && (
                        <button
                            onClick={(actionButton as any).onClick}
                            className="w-full py-4 relative overflow-hidden rounded-2xl font-black text-xs uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 group"
                            style={{
                                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                                boxShadow: '0 8px 24px rgba(76,175,80,0.35), 0 2px 8px rgba(76,175,80,0.2)',
                                color: 'white',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(76,175,80,0.5), 0 4px 12px rgba(76,175,80,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(76,175,80,0.35), 0 2px 8px rgba(76,175,80,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                        >
                            {/* shimmer layer */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }} />
                            <span className="material-symbols-outlined text-[18px] drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {(actionButton as any).icon}
                            </span>
                            <span className="drop-shadow-sm">{(actionButton as any).label}</span>
                        </button>
                    )
                )}
            </div>
        </aside>
    );
}
