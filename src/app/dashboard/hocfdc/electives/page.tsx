import { cookies } from "next/headers";
import ElectivesManagement from "@/components/hocfdc/ElectivesManagement";
import { GroupResponse } from "@/services/group.service";

export default async function ElectivesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const search = typeof params.search === 'string' ? params.search : '';
    const page = typeof params.page === 'string' ? parseInt(params.page) : 0;
    
    let electives: GroupResponse[] = [];
    let totalPages = 0;
    let totalElements = 0;

    try {
        const token = (await cookies()).get('AUTH_TOKEN_COOKIE')?.value;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group?page=${page}&size=50&type=ELECTIVE&sort=groupCode,desc${search ? `&search=${search}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });
        const data = await res.json();
        
        if (data.data?.content) {
            electives = data.data.content as GroupResponse[];
            totalElements = data.data.totalElements;
            totalPages = data.data.totalPages;
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <ElectivesManagement 
            initialData={electives}
            initialTotalPages={totalPages}
            initialTotalElements={totalElements}
            currentPage={page}
            initialSearch={search}
        />
    );
}
