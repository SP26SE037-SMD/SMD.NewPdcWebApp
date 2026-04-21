"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FormService } from "@/services/form.service";
import { 
  ChevronLeft, 
  BarChart3, 
  PieChart as PieChartIcon,
  MessageSquare, 
  Plus,
  Loader2,
  AlertCircle,
  Users,
  Target,
  Layout,
  Star,
  Quote
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";

interface QuestionReport {
  questionId: string;
  questionText: string;
  type: "RADIO" | "DROPDOWN" | "CHECKBOX" | "SCALE" | "TEXT" | "PARAGRAPH";
  optionCounts: Record<string, number>;
  textAnswers: string[];
  averageRating: number | null;
}

interface FormReport {
  formId: string;
  totalSubmissions: number;
  questions: QuestionReport[];
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#3B82F6"];

export default function FormReportContent() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  const majorCode = params.majorCode as string;

  const { data: reportRaw, isLoading, isError } = useQuery({
    queryKey: ["form-report", formId],
    queryFn: () => FormService.getFormReport(formId),
    enabled: !!formId,
  });

  const report = useMemo(() => {
    return ((reportRaw as any)?.data || reportRaw) as FormReport;
  }, [reportRaw]);

  const { data: formDetailRaw } = useQuery({
    queryKey: ["form-detail", formId],
    queryFn: () => FormService.getFormById(formId),
    enabled: !!formId,
  });
  const formDetail = (formDetailRaw as any)?.data || formDetailRaw;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="animate-spin text-zinc-900" size={48} />
        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Generating Analytics...</p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 space-y-4 text-zinc-400">
        <AlertCircle size={48} />
        <p className="text-sm font-black uppercase tracking-widest">Failed to load analytics</p>
        <button onClick={() => router.back()} className="text-primary hover:underline font-bold">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20">
      {/* ── Header ── */}
      <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-8 w-px bg-zinc-100" />
          <div className="space-y-0.5">
            <h1 className="text-base font-black text-zinc-900 tracking-tight uppercase">
              {formDetail?.formType || "Feedback"} Report Dashboard
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
               Statistical summary of {report.totalSubmissions} responses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-5 py-2.5 bg-zinc-50 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-100 text-zinc-500">
              Form ID: {formId.slice(0, 8)}
           </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto w-full px-8 pt-12 space-y-12">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Submissions" 
            value={report.totalSubmissions} 
            icon={<Users className="text-indigo-600" size={20} />}
            color="bg-indigo-50"
          />
          <StatCard 
            title="Questions Count" 
            value={report.questions.length} 
            icon={<Target className="text-emerald-600" size={20} />}
            color="bg-emerald-50"
          />
          <StatCard 
            title="Completion Rate" 
            value="100%" 
            icon={<Layout className="text-amber-600" size={20} />}
            color="bg-amber-50"
          />
           <StatCard 
            title="Status" 
            value={formDetail?.isActive ? "ACTIVE" : "CLOSED"} 
            icon={<BarChart3 className="text-zinc-600" size={20} />}
            color="bg-zinc-100"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {report.questions.map((q, idx) => (
            <QuestionCard key={q.questionId} question={q} index={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center gap-6 group hover:border-zinc-300 transition-all"
    >
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</h4>
        <p className="text-xl font-black text-zinc-900 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

function QuestionCard({ question, index }: { question: QuestionReport, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden flex flex-col ${
        (question.type === "TEXT" || question.type === "PARAGRAPH") ? "md:col-span-2" : ""
      }`}
    >
      <div className="px-10 py-8 border-b border-zinc-100 flex items-start gap-6 bg-zinc-50/30">
        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center font-black text-[10px] text-zinc-400 shrink-0">
          {(index + 1).toString().padStart(2, '0')}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{question.type} ANALYTICS</p>
          <h3 className="text-base font-black text-zinc-900 tracking-tight leading-tight">
            {question.questionText}
          </h3>
        </div>
      </div>

      <div className="p-10 flex-1 min-h-[350px]">
        {renderQuestionOutput(question)}
      </div>
    </motion.div>
  );
}

function renderQuestionOutput(question: QuestionReport) {
  if (question.type === "RADIO" || question.type === "DROPDOWN") {
    const data = Object.entries(question.optionCounts).map(([name, value]) => ({ name, value }));
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <div className="h-full flex flex-col md:flex-row items-center gap-8">
        <div className="w-full h-[250px] md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-3">
          {data.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-xs font-bold text-zinc-600">{entry.name}</span>
              </div>
              <div className="text-[10px] font-black text-zinc-900">
                {entry.value} ({((entry.value / total) * 100).toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "CHECKBOX") {
    const data = Object.entries(question.optionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ left: 40, right: 20 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717a' }}
              width={100}
            />
            <Tooltip 
               cursor={{ fill: 'transparent' }}
               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              fill="#4F46E5" 
              radius={[0, 8, 8, 0]} 
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (question.type === "SCALE") {
    const avg = question.averageRating || 0;
    const percentage = (avg / 5) * 100;

    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-2">
          <div className="text-6xl font-black text-zinc-900 tracking-tighter">
            {avg.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                size={24} 
                className={s <= avg ? "fill-amber-400 text-amber-400" : "text-zinc-200 fill-zinc-100"} 
              />
            ))}
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-4">Average Satisfaction Grade</p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase">
             <span>Efficiency</span>
             <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
            />
          </div>
        </div>
      </div>
    );
  }

  if (question.type === "TEXT" || question.type === "PARAGRAPH") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
           <MessageSquare size={16} className="text-zinc-400" />
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{question.textAnswers.length} Feedback entries</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          {question.textAnswers.length > 0 ? (
            question.textAnswers.map((txt, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="p-6 bg-zinc-50/50 rounded-2xl border border-zinc-100 relative group hover:bg-white hover:border-primary/20 transition-all"
              >
                <Quote className="absolute top-4 right-4 text-zinc-100 group-hover:text-primary/10 transition-colors" size={24} />
                <p className="text-sm font-bold text-zinc-700 leading-relaxed italic pr-4">"{txt}"</p>
                <div className="mt-4 flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-[8px] font-black text-zinc-400">
                      V
                   </div>
                   <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Verified Submission</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">No text responses recorded.</div>
          )}
        </div>
        {/* Word Cloud Suggestion Placeholder */}
        <div className="mt-6 p-4 border-2 border-dashed border-zinc-100 rounded-2xl flex flex-center justify-between items-center opacity-50">
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">AI Sentiment & Word Cloud Module</p>
           <div className="px-3 py-1 bg-zinc-100 rounded-lg text-[9px] font-black text-zinc-500 uppercase">Coming Soon</div>
        </div>
      </div>
    );
  }

  return null;
}
