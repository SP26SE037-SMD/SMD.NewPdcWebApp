import DashboardLayout from "@/components/layout/dashboard-layout";
import { ToastProvider } from "@/components/ui/Toast";

export default function VicePrincipalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}
