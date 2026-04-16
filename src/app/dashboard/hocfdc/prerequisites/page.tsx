import PrerequisiteManagement from "@/components/hocfdc/PrerequisiteManagement";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Prerequisite Tree | SMD',
    description: 'Manage prerequisite hierarchies for subjects.',
};

export default function PrerequisitePage() {
    return <PrerequisiteManagement />;
}
