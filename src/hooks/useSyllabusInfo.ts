import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setSyllabusInfo } from '@/store/slices/syllabusSlice';
import { SyllabusService } from '@/services/syllabus.service';
import { SourceService } from '@/services/source.service';
import { CloPloService } from '@/services/cloplo.service';
import { formatBloomLevel } from '@/components/dashboard/SyllabusInfoModal';

export function useSyllabusInfo(syllabusId?: string | null) {
    const dispatch = useDispatch<AppDispatch>();
    const syllabusInfoDB = useSelector((state: RootState) => state.syllabus.syllabusInfoDB);
    const syllabusInfo = syllabusId ? syllabusInfoDB[syllabusId] : undefined;
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (!syllabusId || syllabusInfo || isFetchingInfo) return;
        
        setIsFetchingInfo(true);
        (async () => {
            try {
                const [syllabusRes, sourcesRes, closRes] = await Promise.allSettled([
                    SyllabusService.getSyllabusById(syllabusId),
                    SourceService.getSubjectSources(''), // placeholder
                    Promise.resolve(null)
                ]);

                let subjectId: string | undefined;
                let bloomText = 'Unknown';
                if (syllabusRes.status === 'fulfilled' && syllabusRes.value?.data) {
                    const s = syllabusRes.value.data as any;
                    bloomText = formatBloomLevel(s.minBloomLevel);
                    subjectId = s.subjectId;
                }

                let sourcesReference: string[] = [];
                let clos: string[] = [];

                if (subjectId) {
                    const [src, cloRes] = await Promise.allSettled([
                        SourceService.getSubjectSources(subjectId),
                        CloPloService.getSubjectClos(subjectId, 0, 100)
                    ]);
                    if (src.status === 'fulfilled' && src.value?.data) {
                        const d = src.value.data as any[];
                        sourcesReference = d.map((s: any) =>
                            `${s.author ? s.author + '. ' : ''}${s.sourceName}${s.publisher ? ' - ' + s.publisher : ''}${s.publishedYear ? ' (' + s.publishedYear + ')' : ''}`
                        );
                    }
                    if (cloRes.status === 'fulfilled' && cloRes.value?.data?.content) {
                        clos = cloRes.value.data.content.map((c: any) => `[${c.cloCode}] ${c.description}`);
                    }
                }

                if (mounted) {
                    dispatch(setSyllabusInfo({
                        syllabusId,
                        info: {
                            bloomTaxonomy: bloomText,
                            sourcesReference: sourcesReference.length > 0 ? sourcesReference : ['No references available.'],
                            clos: clos.length > 0 ? clos : ['No CLOs available.'],
                        }
                    }));
                }
            } catch (e) {
                console.error('Failed to fetch syllabus info:', e);
            } finally {
                if (mounted) setIsFetchingInfo(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [syllabusId, syllabusInfo, dispatch]); // excluded isFetchingInfo from deps to prevent rebinding

    return { syllabusInfo, isLoading: isFetchingInfo && !syllabusInfo };
}
