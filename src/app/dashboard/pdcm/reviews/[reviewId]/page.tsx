import { redirect } from 'next/navigation';

export default async function ReviewRootRedirect({
    params
}: {
    params: Promise<{ reviewId: string }>
}) {
    const { reviewId } = await params;
    // Automatically redirect to the Information tab when accessing the root review workspace URL
    redirect(`/dashboard/pdcm/reviews/${reviewId}/information`);
}
