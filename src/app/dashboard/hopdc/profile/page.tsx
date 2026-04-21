import ProfileContent from "@/components/profile-content";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Profile | SMD',
};

export default function HoPDCProfilePage() {
    return <ProfileContent />;
}
