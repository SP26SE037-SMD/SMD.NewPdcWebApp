"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  GitBranch,
  UserCheck,
  GraduationCap,
  Building2,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div 
      className="flex flex-col min-h-screen bg-[#FDFDFD] text-[#1E293B]" 
      style={{ '--font-sans': 'var(--font-inter)' } as React.CSSProperties}
    >
      {/* Institutional Top Bar */}
      <div className="bg-[#1E293B] text-white py-2 px-6 text-xs flex justify-between items-center tracking-wide">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 opacity-80"><Building2 size={12} /> Academic Quality Control Board</span>
          <span className="opacity-40">|</span>
          <span className="opacity-80">Syllabus Management System v1.0</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 opacity-80">
          <span>Portal Access</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/icon-with-name.png"
                alt="SMD Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="h-6 w-[1px] bg-zinc-300" />
              <img
                src="/fpt-logo.png"
                alt="FPT University"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="h-8 w-[1px] bg-zinc-200 hidden md:block" />
            <span className="text-zinc-500 font-medium text-sm hidden md:block tracking-tight leading-tight uppercase">
              Standardizing Academic Excellence Through<br />Digital Transformation
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-zinc-600">
              <a href="#workflow" className="hover:text-primary transition-colors">Workflow</a>
              <a href="#compliance" className="hover:text-primary transition-colors">Compliance</a>
              <a href="#roadmap" className="hover:text-primary transition-colors">Roadmap</a>
            </div>
            <Link href="/login" className="bg-primary text-white px-6 py-2.5 rounded-sm font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md active:scale-95">
              Secure Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Institutional Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-zinc-100">
          <div className="container mx-auto px-6 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
              >
                <GraduationCap size={14} /> Official University Tool
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl lg:text-5xl font-serif font-medium leading-tight text-[#0F172A]"
              >
                Standardizing Academic Excellence Through <span className="text-primary italic">Digital Transformation</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-zinc-600 max-w-2xl leading-relaxed font-sans"
              >
                SMD is an institutional framework designed to centralize curriculum workflows, ensure Bloom's Taxonomy compliance, and facilitate automated syllabus versioning for Higher Education providers.
              </motion.p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="border-l-2 border-primary/20 pl-4">
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-xs text-muted font-bold tracking-tighter uppercase">Digitalization</p>
                </div>
                <div className="border-l-2 border-primary/20 pl-4">
                  <p className="text-2xl font-bold">AI</p>
                  <p className="text-xs text-muted font-bold tracking-tighter uppercase">AI Quality Check</p>
                </div>
                <div className="border-l-2 border-primary/20 pl-4">
                  <p className="text-2xl font-bold">7/24</p>
                  <p className="text-xs text-muted font-bold tracking-tighter uppercase">Real-time Collaboration</p>
                </div>
                <div className="border-l-2 border-primary/20 pl-4">
                  <p className="text-2xl font-bold">PDF/Word</p>
                  <p className="text-xs text-muted font-bold tracking-tighter uppercase">PDF/Word Audit Export</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 w-full lg:max-w-xl"
            >
              <div className="bg-zinc-100 rounded-xl p-2 shadow-2xl border border-zinc-200">
                <div className="bg-white rounded-lg p-6 shadow-inner">
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Syllabus Review Interface</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-zinc-100 rounded w-3/4" />
                    <div className="h-4 bg-zinc-100 rounded w-1/2" />
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="h-20 bg-primary/5 border border-primary/10 rounded-lg flex flex-col items-center justify-center gap-2">
                        <ShieldCheck size={20} className="text-primary" />
                        <span className="text-[10px] font-bold text-primary italic">Bloom Scan</span>
                      </div>
                      <div className="h-20 bg-zinc-50 border border-zinc-100 rounded-lg flex flex-col items-center justify-center gap-2">
                        <GitBranch size={20} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400">Diff View</span>
                      </div>
                      <div className="h-20 bg-zinc-50 border border-zinc-100 rounded-lg flex flex-col items-center justify-center gap-2">
                        <UserCheck size={20} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400">Approval</span>
                      </div>
                    </div>
                    <div className="pt-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <div className="h-2 bg-zinc-100 rounded w-full" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <div className="h-2 bg-zinc-100 rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-24 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mb-20 text-center mx-auto md:text-left md:mx-0">
              <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-4">The Governance Workflow</h2>
              <h3 className="text-3xl font-serif font-medium text-zinc-800 leading-snug">
                Structured Roles. Verified Outcomes.
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x border border-zinc-200 rounded-lg overflow-hidden bg-white">
              {[
                { step: "01", role: "PDCM / Collaborator", task: "Syllabus Creation", desc: "Developing course objectives and lesson plans within institutional templates." },
                { step: "02", role: "HoPDC", task: "Curriculum Review", desc: "Expert assessment and inline feedback using AI-assisted impact scanning." },
                { step: "03", role: "HoCFDC", task: "Framework Alignment", desc: "Mapping knowledge blocks and managing Semester-wise distribution." },
                { step: "04", role: "Vice Principal", task: "Final Proclamation", desc: "Official digital signature and activation of the curriculum lifecycle." }
              ].map((item, i) => (
                <div key={i} className="p-10 hover:bg-zinc-50 transition-colors group">
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-primary transition-colors">{item.step}</span>
                  <h4 className="font-bold text-zinc-800 mt-4 mb-2">{item.role}</h4>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-4">{item.task}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className="bg-[#0F172A] text-white/50 border-t border-white/5 py-16">
        <div className="container mx-auto px-6 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-4 mx-auto md:mx-0">
                <img
                  src="/icon-with-name.png"
                  alt="SMD Logo"
                  className="h-9 w-auto object-contain brightness-0 invert"
                />
                <div className="h-5 w-[1px] bg-white/20" />
                <img
                  src="/fpt-logo.png"
                  alt="FPT University"
                  className="h-7 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
                Syllabus Management and Digitalization (SMD) is an enterprise-grade academic lifecycle management system.
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-6">Portal</h5>
              <ul className="text-sm space-y-3">
                <li><a href="#" className="hover:text-primary transition-colors">Internal Login</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Audit Logs</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs tracking-tight gap-4">
            <p>© 2026 SMD Project Team. FPT University Capstone.</p>
            <div className="flex gap-4">
              <span>System Health: <span className="text-green-500 font-bold uppercase">Operational</span></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
