import { useQuery } from '@tanstack/react-query';
import { SyllabusService } from '@/services/syllabus.service';
import { MaterialService } from '@/services/material.service';
import { SessionService } from '@/services/session.service';
import { AssessmentService } from '@/services/assessment.service';
import { SubjectService } from '@/services/subject.service';
import { useSearchParams } from 'next/navigation';

export function useSyllabusWorkspace(syllabusId: string | undefined) {
    const searchParams = useSearchParams();
    const isMockMode = searchParams.get("mock") === "true";
    const isEnabled = !!syllabusId && !isMockMode;

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
        enabled: !!subjectId && !isMockMode,
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

    if (isMockMode) {
        return {
            syllabus: {
                syllabusId: "mock-id",
                syllabusName: "Thiết kế đồ họa nâng cao - 2024",
                status: "PENDING_REVIEW",
                minBloomLevel: 4,
                createdAt: "2024-05-12",
                subjectCode: "GRD301",
                subjectName: "Graphic Design Advanced"
            },
            subject: {
                subjectCode: "GRD301",
                subjectName: "Graphic Design Advanced",
                noCredit: 3,
            },
            materials: [
                { materialId: "m1", title: "Giáo trình Typography & Layout", type: "PDF", url: "#" },
                { materialId: "m2", title: "Video hướng dẫn thiết kế Brand Identity", type: "VIDEO", url: "#" },
                { materialId: "m3", title: "Slide bài giảng: Phối màu trong thiết kế", type: "SLIDE", url: "#" },
                { materialId: "m4", title: "E-book: UX/UI Design Patterns", type: "PDF", url: "#" }
            ],
            sessions: [
                { sessionId: "s1", sessionNo: 1, title: "Tổng quan về thiết kế thương hiệu", description: "Phân tích các yếu tố cốt lõi của một bộ nhận diện thương hiệu thành công." },
                { sessionId: "s2", sessionNo: 2, title: "Kỹ thuật Typography nâng cao", description: "Cách sử dụng font chữ để tạo điểm nhấn và phân cấp thông tin." },
                { sessionId: "s3", sessionNo: 3, title: "Tư duy thiết kế Layout Web", description: "Ứng dụng hệ thống Grid System trong thiết kế giao diện hiện đại." }
            ],
            assessments: [
                { assessmentId: "a1", name: "Assignment 1: Logo Concept", weight: 20, type: "PRACTICAL" },
                { assessmentId: "a2", name: "Progress Test: Theory of Design", weight: 15, type: "QUIZ" },
                { assessmentId: "a3", name: "Final Project: Full Brand Identity", weight: 50, type: "PRACTICAL" }
            ],
            isLoading: false,
            isError: false,
            refetchAll: () => {}
        };
    }

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
