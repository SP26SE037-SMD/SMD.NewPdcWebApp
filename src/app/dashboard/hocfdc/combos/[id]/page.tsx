import GroupDetail from "@/components/hocfdc/GroupDetail";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

export default async function ComboPage({ params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    let comboData = null;
    let subjectsData = [];

    try {
        const [comboRes, subjectsRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/group/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            }),
            fetch(`${BACKEND_URL}/api/curriculum-group-subjects/subjects?searchType=group&searchId=${params.id}&page=0&size=100`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            })
        ]);

        if (comboRes.ok) {
            const json = await comboRes.json();
            comboData = json.data;
        }

        if (subjectsRes.ok) {
            const json = await subjectsRes.json();
            subjectsData = json.data?.content || [];
        }
    } catch (e) {
        console.error("Failed to fetch combo details on server:", e);
    }

    return <GroupDetail combo={comboData} subjects={subjectsData} />;
}
