import { useQuery } from '@tanstack/react-query';
import { SyllabusService } from '@/services/syllabus.service';
import { MaterialService } from '@/services/material.service';
import { SessionService } from '@/services/session.service';
import { AssessmentService } from '@/services/assessment.service';
import { SubjectService } from '@/services/subject.service';

export function useSyllabusWorkspace(syllabusId: string | undefined) {
    const isEnabled = !!syllabusId;

    const syllabusQuery = useQuery({
        queryKey: ['syllabus-workspace-info', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
        enabled: isEnabled,
        staleTime: 5 * 60 * 1000,
    });

    const subjectId = syllabusQuery.data?.data?.subjectId;

    const subjectQuery = useQuery({
        queryKey: ['syllabus-workspace-subject', subjectId],
        queryFn: () => SubjectService.getSubjectDetail(subjectId!),
        enabled: !!subjectId,
        staleTime: 5 * 60 * 1000,
    });

    const materialsQuery = useQuery({
        queryKey: ['syllabus-workspace-materials', syllabusId],
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId!),
        enabled: isEnabled,
        staleTime: 5 * 60 * 1000,
    });

    const sessionsQuery = useQuery({
        queryKey: ['syllabus-workspace-sessions', syllabusId],
        queryFn: () => SessionService.getDetailedSessions(syllabusId!),
        enabled: isEnabled,
        staleTime: 5 * 60 * 1000,
    });

    const assessmentsQuery = useQuery({
        queryKey: ['syllabus-workspace-assessments', syllabusId],
        queryFn: () => AssessmentService.getAssessmentsBySyllabusId(syllabusId!),
        enabled: isEnabled,
        staleTime: 5 * 60 * 1000,
    });

    const isLoading = 
        syllabusQuery.isLoading || 
        materialsQuery.isLoading || 
        sessionsQuery.isLoading || 
        assessmentsQuery.isLoading ||
        subjectQuery.isLoading;

    const isError = 
        syllabusQuery.isError || 
        materialsQuery.isError || 
        sessionsQuery.isError || 
        assessmentsQuery.isError;

    return {
        syllabus: syllabusQuery.data?.data,
        subject: (subjectQuery.data as any)?.data || subjectQuery.data,
        materials: materialsQuery.data?.data || [],
        sessions: sessionsQuery.data?.data?.content || [],
        assessments: Array.isArray(assessmentsQuery.data?.data) 
            ? assessmentsQuery.data.data 
            : (assessmentsQuery.data?.data?.content || []),
        isLoading,
        isError,
        refetchAll: () => {
            syllabusQuery.refetch();
            materialsQuery.refetch();
            sessionsQuery.refetch();
            assessmentsQuery.refetch();
            subjectQuery.refetch();
        }
    };
}
