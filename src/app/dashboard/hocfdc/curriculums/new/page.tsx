"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CurriculumService } from "@/services/curriculum.service";

// Relative imports to avoid any alias issues
import CurriculumInfoStep from "../../../../../components/hocfdc/create-curriculum/CurriculumInfoStep";
import PloDefinitionStep from "../../../../../components/hocfdc/create-curriculum/PloDefinitionStep";
import MappingStep from "../../../../../components/hocfdc/create-curriculum/MappingStep";
import CourseBuilderStep from "../../../../../components/hocfdc/create-curriculum/CourseBuilderStep";
import ReviewPublishStep from "../../../../../components/hocfdc/create-curriculum/ReviewPublishStep";
import ProgressStepper from "../../../../../components/hocfdc/create-curriculum/ProgressStepper";

function NewCurriculumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const curriculumIdFromUrl = searchParams.get("id");

  const [step, setStep] = useState(1);
  const [shouldProceedAfterSave, setShouldProceedAfterSave] = useState(false);

  // Fetch Existing Curriculum if ID is present
  const { data: existingCurriculum, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["curriculum-detail", curriculumIdFromUrl],
    queryFn: () => CurriculumService.getCurriculumById(curriculumIdFromUrl!),
    enabled: !!curriculumIdFromUrl,
    staleTime: 0, // Ensure we always check for the latest data when manually invalidated
  });

  // Mutation for Step 1 creation/update
  const createMutation = useMutation({
    mutationFn: (payload: any) => {
      if (curriculumIdFromUrl) {
        return CurriculumService.updateCurriculum(curriculumIdFromUrl, payload);
      }
      return CurriculumService.createCurriculum(payload);
    },
    onSuccess: (response: any) => {
      const responseData = response?.data || response;
      const newId = responseData?.curriculumId || curriculumIdFromUrl;
      
      toast.success(curriculumIdFromUrl ? "Curriculum draft updated" : "Curriculum identity established");
      
      // 1. Invalidate Cache to revalidate data across the app
      queryClient.invalidateQueries({ queryKey: ["curriculum-detail", newId] });
      
      // 2. Update URL if it was a new creation
      if (!curriculumIdFromUrl && newId) {
        router.replace(`/dashboard/hocfdc/curriculums/new?id=${newId}`);
      }

      // 3. Navigate if requested
      if (shouldProceedAfterSave) {
        setStep(2);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  });

  const handleSaveStep1 = (data: any, proceed: boolean = false) => {
    setShouldProceedAfterSave(proceed);
    createMutation.mutate(data);
  };

  const handleNext = () => setStep((prev: number) => Math.min(prev + 1, 5));
  const handleBack = () => setStep((prev: number) => Math.max(prev - 1, 1));

  const handleSubmitFinal = () => {
    toast.success("Curriculum submitted for final approval");
  };

  if (isLoadingExisting && curriculumIdFromUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest font-['Plus_Jakarta_Sans']">
              Refreshing Workspace Data
            </p>
          </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-8 flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/hocfdc/curriculums")}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-bold text-sm transition-all group"
        >
          <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center group-hover:border-zinc-900 transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </div>
          Back to Curriculums
        </button>

        {curriculumIdFromUrl && (
          <div className="flex items-center gap-2 text-zinc-300 text-[10px] font-black uppercase tracking-[0.2em] bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-100">
            Draft ID: {curriculumIdFromUrl.split('-')[0]}...
          </div>
        )}
      </div>

      <div className="pt-6">
        <ProgressStepper currentStep={step} />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.99, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.01, y: -15 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 && (
            <CurriculumInfoStep 
              onNext={handleNext} 
              onSave={handleSaveStep1}
              isSaving={createMutation.isPending}
              initialData={existingCurriculum?.data || existingCurriculum}
            />
          )}
          {step === 2 && <PloDefinitionStep onNext={handleNext} onBack={handleBack} />}
          {step === 3 && <MappingStep onNext={handleNext} onBack={handleBack} />}
          {step === 4 && <CourseBuilderStep onNext={handleNext} onBack={handleBack} />}
          {step === 5 && <ReviewPublishStep onNext={handleSubmitFinal} onBack={handleBack} />}
        </motion.div>
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-50/50 rounded-full blur-[120px] -ml-64 -mb-64" />
      </div>
    </div>
  );
}

export default function NewCurriculumPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white font-['Plus_Jakarta_Sans']">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      }
    >
      <NewCurriculumContent />
    </Suspense>
  );
}
