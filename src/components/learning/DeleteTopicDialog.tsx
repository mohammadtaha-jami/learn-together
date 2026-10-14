"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Trash2 } from "lucide-react";
import type { TopicScope } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type DeleteTopicTarget = {
  id: string;
  titleEn: string;
  titleFa: string | null;
  scope: TopicScope;
  teamName?: string | null;
};

export function DeleteTopicDialog({
  open,
  onClose,
  topic,
  redirectTo,
}: {
  open: boolean;
  onClose: () => void;
  topic: DeleteTopicTarget | null;
  /** After delete from detail page */
  redirectTo?: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/topics/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "حذف موضوع انجام نشد");
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["topics"] });
      await qc.invalidateQueries({ queryKey: ["overview"] });
      onClose();
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      }
    },
  });

  const title = topic?.titleFa?.trim() || topic?.titleEn || "";
  const isTeam = topic?.scope === "TEAM";

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!del.isPending) onClose();
      }}
      title="حذف موضوع"
      description="این عمل قابل بازگشت نیست."
      icon={<Trash2 className="h-5 w-5" />}
    >
      {topic && (
        <>
          <p className="text-sm leading-7 text-text-muted">
            موضوع <strong className="text-text">«{title}»</strong>
            {isTeam && topic.teamName ? (
              <>
                {" "}
                (تیم <strong className="text-text">{topic.teamName}</strong>)
              </>
            ) : null}{" "}
            و همهٔ سرفصل‌ها، مباحث و پیشرفت‌های مرتبط برای{" "}
            {isTeam ? "تمام اعضای تیم" : "شما"} حذف می‌شود.
          </p>
          {del.error && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {(del.error as Error).message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" disabled={del.isPending} onClick={onClose}>
              انصراف
            </Button>
            <Button
              variant="danger"
              disabled={del.isPending}
              onClick={() => del.mutate(topic.id)}
            >
              <Trash2 className="h-4 w-4" />
              {del.isPending ? "در حال حذف…" : "حذف موضوع"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
