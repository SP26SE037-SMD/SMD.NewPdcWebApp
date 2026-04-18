const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/components/vp/manage-majors-content.tsx';
let data = fs.readFileSync(file, 'utf8');

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
      setWizardStep(4);
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

const insertMarker = "// Delete Major Mutation";
data = data.replace(insertMarker, submitAllDataMutationCode + "\n  " + insertMarker);

fs.writeFileSync(file, data);
