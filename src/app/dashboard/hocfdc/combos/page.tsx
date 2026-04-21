import GroupsManagement from "@/components/hocfdc/GroupsManagement";
import { GroupService } from "@/services/group.service";
import { GroupResponse } from "@/services/group.service";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

export default async function CombosPage({
    searchParams,
}: {
    searchParams: { search?: string; page?: string; status?: string };
}) {
    const search = searchParams.search || "";
    // Note: Backend might use 0-indexed pagination, while UI uses 1-indexed. We pass `page - 1` if we parse it.
    const currentPage = Number(searchParams.page) || 1;
    const currentStatus = searchParams.status || "all";

    // Call API internally bypassing client fetch. To forward cookies safely we would need the fetch interceptor 
    // or direct `fetch()` call. Given we created ComboService with generic getters, it might fail on Next.js
    // server without headers. Let's do the exact same safe fetch as Subjects and Curriculums.

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    let initialData: GroupResponse[] = [];
    let totalPages = 1;
    let totalElements = 0;

    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    queryParams.append("type", "COMBO");
    queryParams.append("page", (currentPage - 1).toString());
    queryParams.append("size", "10");

    try {
        const res = await fetch(`${BACKEND_URL}/api/group?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: 'no-store'
        });

        if (res.ok) {
            const json = await res.json();
            if (json.data) {
                initialData = json.data.content as GroupResponse[];
                totalPages = json.data.totalPages;
                totalElements = json.data.totalElements;
            }
        }
    } catch (error) {
        console.error("Failed to fetch combos internally:", error);
    }

    return (
        <GroupsManagement 
            initialData={initialData}
            initialTotalPages={totalPages}
            initialTotalElements={totalElements}
            currentPage={currentPage}
            currentSearch={search}
            currentStatus={currentStatus}
        />
    );
}
