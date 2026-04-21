import HoCFDCDashboardContent from "@/components/dashboard/hocfdc-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'HoCFDC Dashboard | SMD',
};

export default function HoCFDCDashboard() {
    return <HoCFDCDashboardContent />;
}
