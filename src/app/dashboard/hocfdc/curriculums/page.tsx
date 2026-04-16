import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import CurriculumsManagement from "@/components/hocfdc/CurriculumsManagement";

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export default async function CurriculumsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 0;
    const search = typeof params.search === 'string' ? params.search : '';
    const status = typeof params.status === 'string' ? params.status : '';

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    let initialData = [];
    let totalPages = 0;
    let totalElements = 0;
    let fetchError = null;

    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: '10',
            sort: 'curriculumCode,asc'
        });
        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);

        const backendResponse = await fetch(`${BACKEND_URL}/api/curriculums?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            cache: 'no-store'
        });

        if (!backendResponse.ok) {
            fetchError = 'Failed to load curriculums from backend';
        } else {
            const responseData = await backendResponse.json();
            if (responseData.data) {
                initialData = responseData.data.content || [];
                totalPages = responseData.data.totalPages || 0;
                totalElements = responseData.data.totalElements || 0;
            }
        }
    } catch (error) {
        console.error(`[Server Component] Error fetching curriculums list:`, error);
        fetchError = 'Failed to load curriculums';
    }

    return (
        <CurriculumsManagement 
            initialData={initialData} 
            initialTotalPages={totalPages} 
            initialTotalElements={totalElements}
            currentPage={page}
            currentSearch={search}
            currentStatus={status}
            error={fetchError} 
        />
    );
}
