"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { ToastProvider } from "@/components/ui/Toast";

export default function HoCFDCLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}

