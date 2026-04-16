import { redirect } from 'next/navigation';

export default async function RevisionRootRedirect({
    params
}: {
    params: Promise<{ taskId: string }>
}) {
    const { taskId } = await params;
    // Automatically redirect to the Information tab when accessing the root revision workspace URL
    redirect(`/dashboard/pdcm/revisions/${taskId}/information`);
}
