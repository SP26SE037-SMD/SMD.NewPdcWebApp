import CollaboratorDashboardContent from "@/components/dashboard/collaborator-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Collaborator Dashboard | SMD',
};

export default function CollaboratorDashboard() {
    return <CollaboratorDashboardContent />;
}
