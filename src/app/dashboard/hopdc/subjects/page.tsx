import HoPDCDashboardContent from "@/components/dashboard/hopdc-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Subjects Management | HoPDC | SMD',
};

export default function SubjectsPage() {
    return <HoPDCDashboardContent />;
}
