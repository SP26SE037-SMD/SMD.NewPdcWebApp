import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import SubjectsManagement from "@/components/hocfdc/SubjectsManagement";

const BACKEND_URL = process.env.BACKEND_URL || 'http://43.207.156.116';

export default async function SubjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 0;
    const search = typeof params.search === 'string' ? params.search : '';
    const status = typeof params.status === 'string' ? params.status : '';
    const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'subjectCode';
    const direction = typeof params.direction === 'string' ? params.direction : 'asc';

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
            sortBy: sortBy,
            direction: direction
        });
        if (search) queryParams.append('search', search);
        if (status) queryParams.append('status', status);

        const backendResponse = await fetch(`${BACKEND_URL}/api/subjects?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            cache: 'no-store'
        });

        if (!backendResponse.ok) {
            fetchError = 'Failed to load subjects from backend';
        } else {
            const responseData = await backendResponse.json();
            if (responseData.data) {
                initialData = responseData.data.content || [];
                totalPages = responseData.data.totalPages || 0;
                totalElements = responseData.data.totalElements || 0;
            }
        }
    } catch (error) {
        console.error(`[Server Component] Error fetching subjects list:`, error);
        fetchError = 'Failed to load subjects';
    }

    return (
        <SubjectsManagement 
            initialData={initialData} 
            initialTotalPages={totalPages} 
            initialTotalElements={totalElements}
            currentPage={page}
            currentSearch={search}
            currentStatus={status}
            currentSortBy={sortBy}
            currentDirection={direction}
            error={fetchError} 
        />
    );
}
