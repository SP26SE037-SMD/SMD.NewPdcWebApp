import ElectiveDetail from "@/components/hocfdc/ElectiveDetail";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

export default async function ElectivePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // The cookies() API should be awaited from Next.js 15+ 
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    let electiveData = null;
    let subjectsData = [];

    try {
        const [electiveRes, subjectsRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/group/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            }),
            fetch(`${BACKEND_URL}/api/curriculum-group-subjects/subjects?searchType=group&searchId=${id}&page=0&size=100`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            })
        ]);

        if (electiveRes.ok) {
            const json = await electiveRes.json();
            electiveData = json.data;
        }

        if (subjectsRes.ok) {
            const json = await subjectsRes.json();
            subjectsData = json.data?.content || [];
        }
    } catch (e) {
        console.error("Failed to fetch elective details on server:", e);
    }

    return <ElectiveDetail elective={electiveData} subjects={subjectsData} />;
}
