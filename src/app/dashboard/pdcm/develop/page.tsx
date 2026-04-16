import PDCMDashboardContent from "@/components/dashboard/pdcm-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Develop Syllabus | SMD',
};

export default function DevelopSyllabusPage() {
    return <PDCMDashboardContent defaultTab="develop" />;
}
