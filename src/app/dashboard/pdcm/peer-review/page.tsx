import PDCMDashboardContent from "@/components/dashboard/pdcm-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Peer Review | SMD',
};

export default function PeerReviewPage() {
    return <PDCMDashboardContent defaultTab="peer-review" />;
}
