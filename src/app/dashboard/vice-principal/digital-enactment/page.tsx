import DigitalEnactmentContent from "@/components/vp/digital-enactment-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Digital Enactment | VP Dashboard | SMD',
    description: 'Issue electronic decisions to officially enact new syllabuses.',
};

export default function DigitalEnactmentPage() {
    return <DigitalEnactmentContent />;
}
