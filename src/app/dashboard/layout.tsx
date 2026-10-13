import { Backdrop } from "@/components/layout/Backdrop";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Backdrop />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
