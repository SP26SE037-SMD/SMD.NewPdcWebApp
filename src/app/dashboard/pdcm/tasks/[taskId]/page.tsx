import { redirect } from 'next/navigation';

export default async function TaskRootRedirect({
    params
}: {
    params: Promise<{ taskId: string }>
}) {
    const { taskId } = await params;
    // Automatically redirect to the Information tab when accessing the root task workspace URL
    redirect(`/dashboard/pdcm/tasks/${taskId}/information`);
}
