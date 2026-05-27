"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { usePathname } from "next/navigation";

export default function HoPDCLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSyllabusDetail = pathname?.includes("/dashboard/hopdc/syllabuses/");

  return <DashboardLayout>{children}</DashboardLayout>;
}
