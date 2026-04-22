import AssignTaskContent from "@/components/hopdc/AssignmentContent";
import { Metadata } from 'next';
import { Suspense } from "react";

export const metadata: Metadata = {
    title: 'Assign Task | HOPDC Dashboard | SMD',
    description: 'Assign tasks to staff.',
};

export default function AssignTaskPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-zinc-50 rounded-xl m-4">Loading assignments...</div>}>
            <AssignTaskContent />
        </Suspense>
    );
}
