import { cookies } from "next/headers";
import ActiveFrameworksBoard from "@/components/hocfdc/ActiveFrameworksBoard";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://43.207.156.116";

export default async function FrameworkExecutionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  // Fetch all curriculums (ActiveFrameworksBoard filters them locally)
  let initialData = [];
  let error = null;

  try {
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/curriculums?size=100`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      },
    );

    if (!backendResponse.ok) {
      error = `Failed to fetch data: ${backendResponse.status} ${backendResponse.statusText}`;
    } else {
      const dataStr = await backendResponse.text();
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.status === 1000) {
          initialData = data.data?.content || [];
        } else {
          error = data.message || "Failed to load curriculums";
        }
      }
    }
  } catch (err: any) {
    error = err.message || "Connection error. Please try again later.";
  }

  return <ActiveFrameworksBoard initialData={initialData} error={error} />;
}
