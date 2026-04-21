import HoPDCDashboardContent from "@/components/dashboard/hopdc-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'HoPDC Dashboard | SMD',
};

export default function HoPDCDashboard() {
    return <HoPDCDashboardContent />;
}
