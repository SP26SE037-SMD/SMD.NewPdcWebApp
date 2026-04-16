"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User as UserIcon, Mail, Shield, Calendar, MapPin, Hash } from "lucide-react";

export default function ProfileContent() {
    const { user } = useSelector((state: RootState) => state.auth);

    if (!user) return null;

    return (
        <div className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
            {/* Minimal Header */}
            <div className="pb-12 border-b border-zinc-100">
                <h1 className="text-4xl font-medium text-zinc-900 mb-2">Internal Profile.</h1>
                <p className="text-zinc-500 font-medium tracking-tight">System Identity & Access Permissions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm flex flex-col items-center text-center space-y-6">
                        <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center border-4 border-white shadow-md">
                            <UserIcon size={64} className="text-zinc-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900">{user.fullName}</h2>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{user.role}</p>
                        </div>
                        <div className="w-full pt-6 border-t border-zinc-50 flex justify-center gap-4">
                            <div className="text-center">
                                <p className="text-lg font-bold text-zinc-900">
                                    {Array.isArray(user.permissions) ? user.permissions.length : 0}
                                </p>
                                <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Scopes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1E293B] rounded-[2.5rem] p-4 text-white/50 text-[10px] font-bold uppercase tracking-widest text-center">
                        <span className="text-primary italic">Status:</span> Operational
                    </div>
                </div>

                {/* Details Area */}
                <div className="lg:col-span-2 space-y-12">
                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                            <span className="w-8 h-px bg-zinc-200" />
                            Security Credentials
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { icon: Mail, label: "Institutional Email", value: user.email },
                                { icon: Shield, label: "System Role", value: user.role },
                                { icon: Hash, label: "Identity ID", value: user.id },
                                { icon: MapPin, label: "Department", value: "Academic Quality Control" },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-zinc-50 shadow-sm hover:border-zinc-200 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <item.icon size={18} strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-bold text-zinc-900">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                            <span className="w-8 h-px bg-zinc-200" />
                            Access Permissions (Scopes)
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {Array.isArray(user.permissions) && user.permissions.map((perm: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-transparent hover:border-zinc-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
                                        <span className="text-xs font-bold text-zinc-700 tracking-tight">{perm.name || perm}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-400 transition-colors group-hover:text-zinc-600">
                                        SYSTEM_GRANT
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
