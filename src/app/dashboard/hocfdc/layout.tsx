import DashboardLayout from "@/components/layout/dashboard-layout";

export default function HoCFDCLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
