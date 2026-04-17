import { Suspense } from 'react';
import AssignTaskContent from "@/components/hopdc/AssignmentContent";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Assign Task | HOPDC Dashboard | SMD',
    description: 'Assign tasks to staff.',
};

export default function AssignTaskPage() {
    return <Suspense fallback={<div>Loading...</div>}><AssignTaskContent /></Suspense>;
}
