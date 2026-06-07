const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/hopdc/feedback/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!content.includes('import { useSelector }')) {
    content = content.replace(
        'import { useRouter } from "next/navigation";',
        'import { useRouter } from "next/navigation";\nimport { useSelector } from "react-redux";\nimport { RootState } from "@/store";'
    );
}

// 2. Add state
if (!content.includes('const [createDescription')) {
    content = content.replace(
        'const [createFormName, setCreateFormName] = useState("");',
        'const [createFormName, setCreateFormName] = useState("");\n  const [createDescription, setCreateDescription] = useState("");\n  const user = useSelector((state: RootState) => state.auth.user);'
    );
}

// 3. Update handleCreateFeedback
const createFeedbackRegex = /const handleCreateFeedback = async \(\) => \{[\s\S]*?finally \{\s*setSubmitting\(false\);\s*\}\s*\};/;
const newHandleCreateFeedback = `const handleCreateFeedback = async () => {
    const resolvedFormName = createFormName.trim();
    const resolvedDescription = createDescription.trim();

    if (!resolvedFormName) {
      setError("Please enter form name.");
      return;
    }

    if (!user?.accountId) {
      setError("User account not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get departmentId
      const { AccountService } = await import('@/services/account.service');
      const accountRes = await AccountService.getAccountById(user.accountId);
      const departmentId = accountRes?.data?.departmentId;

      if (!departmentId) {
         setError("Department ID not found for current user.");
         setSubmitting(false);
         return;
      }

      const created = await FeedbackFormService.createForm({
        formName: resolvedFormName,
        description: resolvedDescription,
        departmentId: departmentId,
      } as any); // Using as any since payload shape might slightly differ locally
      
      setSuccess(\`Feedback form created: \${created.id}\`);
      showToast(\`Feedback form created: \${created.id}\`, "success");
      
      setIsCreateModalOpen(false);
      setCreateFormName("");
      setCreateDescription("");
      
      // Navigate to designer
      router.push(\`/dashboard/hopdc/feedback/\${created.id}/design\`);
      
    } catch (err: any) {
      const message = err?.message || "Failed to create feedback form";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };`;

content = content.replace(createFeedbackRegex, newHandleCreateFeedback);

// 4. Update Modal UI
const modalUiRegex = /<div className="space-y-5">[\s\S]*?<div className="mt-8 flex items-center justify-end gap-3 pt-2">/;

const newModalUi = `<div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Form Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Pencil className="h-4.5 w-4.5 text-primary/60" />
                    </div>
                    <input
                      value={createFormName}
                      onChange={(e) => setCreateFormName(e.target.value)}
                      disabled={submitting}
                      placeholder="e.g., Midterm Evaluation, Alumni Survey..."
                      className="w-full rounded-2xl border border-outline/20 bg-white/70 pl-11 pr-4 py-3.5 text-[15px] font-semibold text-on-surface outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/15 shadow-sm placeholder:font-medium placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Description
                  </label>
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    disabled={submitting}
                    placeholder="Briefly describe the purpose of this feedback form..."
                    rows={4}
                    className="w-full rounded-2xl border border-outline/20 bg-white/70 p-4 text-[15px] font-semibold text-on-surface outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/15 shadow-sm placeholder:font-medium placeholder:text-on-surface-variant/50 resize-none"
                  />
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 pt-2">`;

content = content.replace(modalUiRegex, newModalUi);

// 5. Update disabled button state
const buttonDisabledRegex = /disabled=\{submitting \|\| !createCurriculumId \|\| !createFormName\.trim\(\)\}/;
content = content.replace(buttonDisabledRegex, 'disabled={submitting || !createFormName.trim()}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched page.tsx');
