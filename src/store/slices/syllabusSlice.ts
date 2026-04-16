import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Material } from '@/lib/mockData';
import { SessionItem } from '@/services/session.service';
import { AssessmentItem } from '@/services/assessment.service';

export interface SyllabusInfo {
  bloomTaxonomy: string;
  sourcesReference: string[];
  clos: string[];
}

export interface SyllabusState {
    materialsDB: Record<string, Record<string, Material>>; // { taskId: { chapterId: Material } }
    sessionsDB: Record<string, SessionItem[]>; // { syllabusId: SessionItem[] }
    assessmentsDB: Record<string, AssessmentItem[]>; // { syllabusId: AssessmentItem[] }
    majorDB: Record<string, string>;
    syllabusInfoDB: Record<string, SyllabusInfo>;
}

const initialState: SyllabusState = {
    materialsDB: {},
    sessionsDB: {},
    assessmentsDB: {},
    majorDB: {},
    syllabusInfoDB: {}
};

export const syllabusSlice = createSlice({
    name: 'syllabus',
    initialState,
    reducers: {
        setSessions: (state, action: PayloadAction<{ syllabusId: string, sessions: SessionItem[] }>) => {
            const { syllabusId, sessions } = action.payload;
            state.sessionsDB[syllabusId] = sessions;
        },
        addSession: (state, action: PayloadAction<{ syllabusId: string, session: SessionItem }>) => {
            const { syllabusId, session } = action.payload;
            if (!state.sessionsDB[syllabusId]) state.sessionsDB[syllabusId] = [];
            state.sessionsDB[syllabusId].push(session);
        },
        updateSession: (state, action: PayloadAction<{ syllabusId: string, index: number, updates: Partial<SessionItem> }>) => {
            const { syllabusId, index, updates } = action.payload;
            if (state.sessionsDB[syllabusId] && state.sessionsDB[syllabusId][index]) {
                state.sessionsDB[syllabusId][index] = { ...state.sessionsDB[syllabusId][index], ...updates };
            }
        },
        removeSession: (state, action: PayloadAction<{ syllabusId: string, index: number }>) => {
            const { syllabusId, index } = action.payload;
            if (state.sessionsDB[syllabusId]) {
                state.sessionsDB[syllabusId].splice(index, 1);
            }
        },
        setMaterial: (state, action: PayloadAction<{ taskId: string, chapterId: string, material: Material }>) => {
            const { taskId, chapterId, material } = action.payload;
            if (!state.materialsDB[taskId]) state.materialsDB[taskId] = {};
            state.materialsDB[taskId][chapterId] = material;
        },
        setAssessments: (state, action: PayloadAction<{ syllabusId: string, assessments: AssessmentItem[] }>) => {
            const { syllabusId, assessments } = action.payload;
            state.assessmentsDB[syllabusId] = assessments;
        },
        addAssessment: (state, action: PayloadAction<{ syllabusId: string, assessment: AssessmentItem }>) => {
            const { syllabusId, assessment } = action.payload;
            if (!state.assessmentsDB[syllabusId]) state.assessmentsDB[syllabusId] = [];
            state.assessmentsDB[syllabusId].push(assessment);
        },
        updateAssessment: (state, action: PayloadAction<{ syllabusId: string, index: number, updates: Partial<AssessmentItem> }>) => {
            const { syllabusId, index, updates } = action.payload;
            if (state.assessmentsDB[syllabusId] && state.assessmentsDB[syllabusId][index]) {
                state.assessmentsDB[syllabusId][index] = { ...state.assessmentsDB[syllabusId][index], ...updates };
            }
        },
        removeAssessment: (state, action: PayloadAction<{ syllabusId: string, index: number }>) => {
            const { syllabusId, index } = action.payload;
            if (state.assessmentsDB[syllabusId]) {
                state.assessmentsDB[syllabusId].splice(index, 1);
            }
        },
        setMajor: (state, action: PayloadAction<{ taskId: string, major: string }>) => {
            const { taskId, major } = action.payload;
            state.majorDB[taskId] = major;
        },
        setSyllabusInfo: (state, action: PayloadAction<{ syllabusId: string, info: SyllabusInfo }>) => {
            const { syllabusId, info } = action.payload;
            state.syllabusInfoDB[syllabusId] = info;
        }
    }
});

export const { 
    setMaterial, setSessions, addSession, updateSession, removeSession, 
    setAssessments, addAssessment, updateAssessment, removeAssessment, setMajor,
    setSyllabusInfo
} = syllabusSlice.actions;

export default syllabusSlice.reducer;
