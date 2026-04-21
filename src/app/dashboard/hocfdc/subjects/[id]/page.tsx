import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import SubjectDetail from "@/components/hocfdc/SubjectDetail";

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    let initialSubject = null;
    let fetchError = null;

    try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/subjects/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            cache: 'no-store'
        });

        if (!backendResponse.ok) {
            fetchError = 'Failed to load subject from backend';
        } else {
            const responseData = await backendResponse.json();
            initialSubject = responseData.data; // Server wrapped it in "data" or original has it? Wait, route.ts just returned what backend gave. From memory, backend returns { status: 200, message: "...", data: Subject }
        }
    } catch (error) {
        console.error(`[Server Component] Error fetching subject ${id}:`, error);
        fetchError = 'Failed to load subject details';
    }

    return <SubjectDetail id={id} initialSubject={initialSubject} initialError={fetchError} />;
}
