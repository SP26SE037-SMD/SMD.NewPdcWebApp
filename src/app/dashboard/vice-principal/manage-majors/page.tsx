import ManageMajorsContent from "@/components/vp/manage-majors-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Majors | VP Dashboard | SMD',
    description: 'Add new academic majors or suspend existing program standards.',
};

export default function ManageMajorsPage() {
    return <ManageMajorsContent />;
}
