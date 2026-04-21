"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRouter } from 'next/navigation';

interface PDCMBaseLayoutProps {
    children: React.ReactNode;
    activeSidebarId?: string;
    headerTitle?: string;
    headerTabs?: {
        id: string;
        label: string;
        isActive: boolean;
        onClick: () => void;
    }[];
    onBack?: () => void;
    actionButton?: React.ReactNode | {
        label: string;
        icon: string;
        onClick: () => void;
    };
    sidebarItems?: {
        id: string;
        label: string;
        icon: string;
        isActive?: boolean;
        onClick?: () => void;
    }[];
    sidebarSubContent?: React.ReactNode;
    subContent?: React.ReactNode;
    pageHeaderContent?: React.ReactNode;
    hideHeader?: boolean;
    fullPage?: boolean;
}

export function PDCMBaseLayout({
    children,
    activeSidebarId,
    headerTitle,
    headerTabs = [
        { id: 'develop', label: 'My Task', isActive: true, onClick: () => {} },
        { id: 'peer-review', label: 'My Review Task', isActive: false, onClick: () => {} },
    ],
    onBack,
    actionButton,
    sidebarItems,
    sidebarSubContent,
    subContent,
    pageHeaderContent,
    hideHeader = false,
    fullPage = false
}: PDCMBaseLayoutProps) {
    const router = useRouter();

    return (
        <div className="h-screen flex flex-col bg-white text-[#2d342b] font-sans selection:bg-[#c1eeba] selection:text-[#345a32] overflow-hidden">
            {!hideHeader && (
                <Header 
                    title={headerTitle}
                    tabs={headerTabs}
                    // Removed actionButton from Header to move to Sidebar
                />
            )}

            <div className={`flex flex-1 relative ${!hideHeader ? 'pt-16' : ''} overflow-hidden`}>
                {sidebarItems && (
                    <Sidebar 
                        items={sidebarItems}
                        subContent={sidebarSubContent}
                        actionButton={actionButton}
                    />
                )}

                <main className={`flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ${sidebarItems ? 'ml-64' : ''} ${fullPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
                    {fullPage ? children : (
                        <div className="max-w-[1600px] mx-auto px-8 py-6">
                            {pageHeaderContent && (
                                <div className="mb-4">
                                    {pageHeaderContent}
                                </div>
                            )}
                            {onBack && (
                                <button 
                                    onClick={onBack}
                                    className="flex items-center gap-2 mb-6 group hover:translate-x-[-4px] transition-transform duration-200"
                                >
                                    <span className="material-symbols-outlined text-[24px] text-[#41683f]">arrow_back</span>
                                    <span className="text-lg font-bold text-[#41683f]">Back</span>
                                </button>
                            )}
                            {children}
                        </div>
                    )}
                </main>
            </div>

            {subContent && (
                <div className="border-t border-outline-variant bg-surface-container-low px-8 py-4">
                    {subContent}
                </div>
            )}
        </div>
    );
}
