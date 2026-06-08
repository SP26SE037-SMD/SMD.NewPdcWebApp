const fs = require('fs');

const files = [
    'src/app/dashboard/pdcm/tasks/[taskId]/assessments/page.tsx',
    'src/app/dashboard/pdcm/revisions/[taskId]/assessments/page.tsx',
    'src/app/dashboard/hopdc/syllabuses/[syllabusId]/assessments/page.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log("File not found: " + file);
        continue;
    }

    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Add clearAiProcessingMessage to imports if missing
    if (!content.includes('clearAiProcessingMessage')) {
        content = content.replace(
            /(import \{[^\}]*\} from '@\/store\/slices\/notificationSlice';)/g,
            "import { clearAiProcessingMessage } from '@/store/slices/notificationSlice';\n$1"
        );
        if (!content.includes('clearAiProcessingMessage')) {
            content = content.replace(
                "import { useToast } from '@/components/ui/Toast';",
                "import { useToast } from '@/components/ui/Toast';\nimport { clearAiProcessingMessage } from '@/store/slices/notificationSlice';"
            );
        }
        modified = true;
    }

    // Add useEffect and aiProcessingStatus extraction from Redux
    if (!content.includes('const { aiProcessingStatus')) {
        const effectString = `
    const { aiProcessingStatus, aiProcessingData, aiProcessingMessage } = useSelector((state: RootState) => state.notification);

    useEffect(() => {
        if (isMappingValidating) {
            if (aiProcessingStatus === "VALIDATE_MAPPING_SUCCESS") {
                setMappingValidationResult(aiProcessingData);
                setIsMappingResultModalOpen(true);
                setIsMappingValidating(false);
                showToast("Mapping validation complete", "success");
                dispatch(clearAiProcessingMessage());
            } else if (aiProcessingStatus === "VALIDATE_MAPPING_FAIL") {
                setIsMappingValidating(false);
                showToast(aiProcessingMessage || "Mapping validation failed", "error");
                dispatch(clearAiProcessingMessage());
            }
        }
    }, [aiProcessingStatus, aiProcessingData, aiProcessingMessage, dispatch, showToast, isMappingValidating]);

    const { data: mappingsRes`;
        content = content.replace("    const { data: mappingsRes", effectString);
        modified = true;
    }

    // Replace handleValidateMappings content
    const handleValidateRegex = /const handleValidateMappings = async \(\) => \{[\s\S]*?finally \{\s*setIsMappingValidating\(false\);\s*\}\s*\};/g;
    
    const newHandleValidate = `const handleValidateMappings = async () => {
        if (!syllabusId) return;
        setIsMappingValidating(true);
        dispatch(clearAiProcessingMessage());
        try {
            const payload = Object.entries(mappingStates).flatMap(([assessmentId, cloIds]) =>
                cloIds.map(cloId => ({ assessmentId, cloId }))
            );
            if (payload.length === 0) {
                showToast("Please select at least one mapping to validate.", "error");
                setIsMappingValidating(false);
                return;
            }
            await MappingService.validateAssessmentMappings(syllabusId, payload);
            showToast("Validation started. Please wait...", "info");
        } catch (error: any) {
            if (error.data?.data && typeof error.data.data.is_valid !== 'undefined') {
                setMappingValidationResult(error.data.data);
                setIsMappingResultModalOpen(true);
            } else if (error.data && typeof error.data.is_valid !== 'undefined') {
                setMappingValidationResult(error.data);
                setIsMappingResultModalOpen(true);
            } else {
                const errMsg = error.message || "Failed to validate mappings";
                showToast(errMsg, "error");
            }
        }
    };`;

    if (content.match(handleValidateRegex)) {
        content = content.replace(handleValidateRegex, newHandleValidate);
        modified = true;
    } else {
        console.log("Could not find handleValidateMappings regex in " + file);
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated: " + file);
    }
}
