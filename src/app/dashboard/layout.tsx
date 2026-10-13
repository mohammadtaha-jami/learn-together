import { Backdrop } from "@/components/layout/Backdrop";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ActiveTeamProvider } from "@/components/team/ActiveTeamProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Backdrop />
      <ActiveTeamProvider>
        <DashboardShell>{children}</DashboardShell>
      </ActiveTeamProvider>
    </>
  );
}
