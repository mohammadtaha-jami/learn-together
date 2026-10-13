import { Suspense } from "react";
import { TopicDetailClient } from "@/components/learning/TopicDetailClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TopicPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Skeleton className="h-44" />}>
      <TopicDetailClient topicId={params.id} />
    </Suspense>
  );
}
