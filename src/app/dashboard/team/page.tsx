import { PageHeader } from "@/components/layout/PageHeader";
import { TeamSetupPanel } from "@/components/dashboard/TeamSetupPanel";
import { TopicList } from "@/components/dashboard/TopicList";

export default function TeamDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="یادگیری تیمی"
        subtitle="موضوع‌های مشترک شما و هم‌تیمی‌هایتان"
      />
      <TeamSetupPanel />
      <TopicList scope="TEAM" />
    </div>
  );
}
