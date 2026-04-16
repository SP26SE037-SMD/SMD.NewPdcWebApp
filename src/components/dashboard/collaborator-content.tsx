"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { User, ShieldCheck, Terminal, Cpu, GitPullRequest, Code2 } from "lucide-react";
import Link from "next/link";

export default function CollaboratorDashboardContent() {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <div className="min-h-screen bg-[#0E1117] text-[#E6EDF3] p-4 md:p-8 selecting-text::bg-[#2F81F7] selecting-text::text-white">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Developer Console Header */}
                <div className="bg-[#161B22] border border-[#30363D] rounded-md p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#21262D] border border-[#30363D] rounded-full flex items-center justify-center shrink-0">
                                <Terminal size={20} className="text-[#2F81F7]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-[#E6EDF3] tracking-tight flex items-center gap-2">
                                    <span className="text-[#8B949E]">~ /</span> collaborator <span className="text-[#8B949E]">/</span> {user?.email.split('@')[0]}
                                </h1>
                                <p className="text-sm text-[#8B949E] mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#238636]"></span>
                                    System online. Logged in as: {user?.fullName}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/collaborator/profile"
                            className="bg-[#21262D] hover:bg-[#30363D] border border-[#363B42] hover:border-[#8B949E] transition-all px-4 py-2 rounded-md text-sm font-medium text-[#C9D1D9] flex items-center gap-2"
                        >
                            <ShieldCheck size={16} className="text-[#8B949E]" /> sudo su profile
                        </Link>
                    </div>
                </div>

                {/* IDE-style Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { title: "Open PRs", value: "3", icon: GitPullRequest, color: "text-[#238636]" },
                        { title: "Active Tasks", value: "5", icon: Code2, color: "text-[#A371F7]" },
                        { title: "Compute Load", value: "12%", icon: Cpu, color: "text-[#2F81F7]" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-md p-5 flex items-center justify-between group">
                            <div>
                                <p className="text-xs text-[#8B949E] uppercase tracking-wider mb-2 font-semibold">{stat.title}</p>
                                <p className="text-2xl font-bold text-[#E6EDF3]">{stat.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded bg-[#21262D] border border-[#30363D] flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main IDE Window */}
                <div className="bg-[#161B22] border border-[#30363D] rounded-md overflow-hidden flex flex-col min-h-[500px]">
                    {/* Window Controls */}
                    <div className="bg-[#0D1117] border-b border-[#30363D] px-4 py-3 flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#F85149]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#D29922]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#2EA043]"></div>
                        </div>
                        <div className="flex-1 text-center text-xs text-[#8B949E] font-medium mx-4">
                            workspace.xml — task-queue
                        </div>
                    </div>

                    {/* Editor Content Area */}
                    <div className="flex-1 flex bg-[#0D1117]">
                        {/* Line Numbers */}
                        <div className="w-12 bg-[#0D1117] border-r border-[#30363D] text-[#484F58] text-right pr-3 py-4 select-none text-sm hidden sm:block">
                            1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13
                        </div>
                        {/* Empty State Code */}
                        <div className="flex-1 p-4 lg:p-8 text-sm overflow-x-auto text-[#E6EDF3] leading-relaxed">
                            <span className="text-[#8B949E]">{"// Task Queue Initialized"}</span><br />
                            <span className="text-[#FF7B72]">import</span> {" { QueueManager } "} <span className="text-[#FF7B72]">from</span> <span className="text-[#A5D6FF]">'@smd/core'</span>;<br />
                            <br />
                            <span className="text-[#FF7B72]">const</span> <span className="text-[#79C0FF]">tasks</span> <span className="text-[#FF7B72]">=</span> <span className="text-[#FF7B72]">await</span> <span className="text-[#D2A8FF]">QueueManager</span>.<span className="text-[#D2A8FF]">fetchActiveTasks</span>({"{ "}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;collaboratorId: <span className="text-[#A5D6FF]">'{user?.accountId}'</span>,<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;status: <span className="text-[#A5D6FF]">'PENDING_ACTION'</span><br />
                            {"});"}<br />
                            <br />
                            <span className="text-[#FF7B72]">if</span> {"(tasks.length === "} <span className="text-[#79C0FF]">0</span> {") {"}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#D2A8FF]">console</span>.<span className="text-[#D2A8FF]">log</span>(<span className="text-[#A5D6FF]">"✨ Your queue is currently empty. Awaiting assignments from PDCM."</span>);<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span>{"return"}</span> <span className="text-[#79C0FF]">SystemStatus</span>.<span className="text-[#79C0FF]">IDLE</span>;<br />
                            {"}"}<br />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
