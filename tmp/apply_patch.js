const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/manage-majors-content.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. handleMajorIdentitySubmit
const oldHandleIdentitySubmit = `  const handleMajorIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMajorId) {
      updateMajorMutation.mutate({ id: currentMajorId, payload: newMajor });
    } else {
      createMutation.mutate(newMajor);
    }
  };`;

const newHandleIdentitySubmit = `  const handleMajorIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingMajor", JSON.stringify(newMajor));
    }
    setWizardStep(2);
  };`;

data = data.replace(oldHandleIdentitySubmit, newHandleIdentitySubmit);

// 2. handleFinalSubmit
const oldHandleFinalSubmit = `  const handleFinalSubmit = () => {
    if (stagedPOs.length === 0) {
      showToast("Please add at least one program outcome.", "error");
      return;
    }
    bulkPOMutation.mutate(stagedPOs);
  };`;

const newHandleFinalSubmit = `  const handleFinalSubmit = () => {
    if (stagedPOs.length === 0) {
      showToast("Please add at least one program outcome.", "error");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingPOs", JSON.stringify(stagedPOs));
    }
    setWizardStep(3);
  };`;

data = data.replace(oldHandleFinalSubmit, newHandleFinalSubmit);

// 3. auto-load from localStorage
const oldUseEffect = `  useEffect(() => {
    if (existingMajorData?.data && wizardStep === 1) {
      setNewMajor({
        majorCode: existingMajorData.data.majorCode,
        majorName: existingMajorData.data.majorName,
        description: existingMajorData.data.description,
      });
    }
  }, [existingMajorData, wizardStep]);`;

const newUseEffect = `  useEffect(() => {
    if (existingMajorData?.data && wizardStep === 1) {
      setNewMajor({
        majorCode: existingMajorData.data.majorCode,
        majorName: existingMajorData.data.majorName,
        description: existingMajorData.data.description,
      });
    } else if (wizardStep === 1 && typeof window !== "undefined" && !currentMajorId) {
      const savedMajor = localStorage.getItem("pendingMajor");
      if (savedMajor) {
        try {
          setNewMajor(JSON.parse(savedMajor));
        } catch(e) {}
      }
      const savedPOs = localStorage.getItem("pendingPOs");
      if (savedPOs) {
        try {
          setStagedPOs(JSON.parse(savedPOs));
        } catch(e) {}
      }
    }
  }, [existingMajorData, wizardStep, currentMajorId]);`;

data = data.replace(oldUseEffect, newUseEffect);

// 4. Update Final Submission Mutation
// We will replace updateStatusMutation with a new one that does everything
// Or use a new submitAllDataMutation

// First, let's just make the existing 'updateStatusMutation' do what we want, or create a final submit function
const oldSubmitButton = `                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: currentMajorId!,
                              status: "INTERNAL_REVIEW",
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-[#4caf50] hover:bg-[#388e3c] text-white font-black uppercase tracking-widest text-[13px] py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#4caf50]/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                        >
                          {updateStatusMutation.isPending ? (`;

const newSubmitButton = `                        <button
                          onClick={() => submitAllDataMutation.mutate()}
                          disabled={submitAllDataMutation.isPending}
                          className="flex-1 bg-[#4caf50] hover:bg-[#388e3c] text-white font-black uppercase tracking-widest text-[13px] py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#4caf50]/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                        >
                          {submitAllDataMutation.isPending ? (`;

data = data.replace(oldSubmitButton, newSubmitButton);

// And we need to add submitAllDataMutation
// We'll insert it right after bulkPOMutation

const submitAllDataMutationCode = `
  const submitAllDataMutation = useMutation({
    mutationFn: async () => {
      // 1. Create Major
      let finalMajorId = currentMajorId;
      if (!finalMajorId) {
        const majorRes = await MajorService.createMajor(newMajor);
        finalMajorId = majorRes.data.majorId;
      }
      
      // 2. Create POs
      if (stagedPOs.length > 0 && finalMajorId) {
        await PoService.createMultiplePOs(finalMajorId, stagedPOs);
      }
      
      // 3. Update status
      if (finalMajorId) {
        await MajorService.updateMajorStatus(finalMajorId, "INTERNAL_REVIEW");
      }
      
      return finalMajorId;
    },
    onSuccess: (newMajorId) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setCurrentMajorId(newMajorId || null);
      setWizardStep(4); // Move to Step 4 (Major Established)
      showToast("Major created and submitted for Board Review successfully.", "success");
      setIsConfirmModalOpen(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("pendingMajor");
        localStorage.removeItem("pendingPOs");
      }
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to submit major", "error");
      setIsConfirmModalOpen(false);
    }
  });
`;

// wait, step 3 currently calls `updateStatusMutation` and `onSuccess` it does setWizardStep(4);
const oldUpdateStatusMutation = `  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      MajorService.updateMajorStatus(id, status),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast(\`Major status updated to \${response.data.status}\`, "success");
      setWizardStep(4); // Move to step 4 only after Final Submission
      setIsConfirmModalOpen(false);
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update major status", "error");
      setIsConfirmModalOpen(false);
    },
  });`;

// Let's replace oldUpdateStatusMutation with both mutations (or just add the new one)
data = data.replace(oldUpdateStatusMutation, oldUpdateStatusMutation + submitAllDataMutationCode);

fs.writeFileSync(file, data);
console.log('Done');
