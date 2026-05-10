import ManageMajorsContent from "@/components/vp/manage-majors-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Majors | VP Dashboard | SMD',
    description: 'Monitor and manage institutional academic majors and program standards.',
};

export default function ManageMajorsPage() {
    return <ManageMajorsContent />;
}
