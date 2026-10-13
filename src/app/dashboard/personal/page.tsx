import { PageHeader } from "@/components/layout/PageHeader";
import { TopicList } from "@/components/dashboard/TopicList";

export default function PersonalDashboardPage() {
  return (
    <div>
      <PageHeader
        title="یادگیری شخصی"
        subtitle="موضوع‌هایی که فقط خودتان می‌بینید"
      />
      <TopicList scope="PERSONAL" />
    </div>
  );
}
