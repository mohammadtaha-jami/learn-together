"use client";

import { useEffect, useState } from "react";

/** Avoid SSR/client mismatch from toLocaleString. */
export function ClientDateTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(new Date(iso).toLocaleString("fa-IR"));
  }, [iso]);

  return (
    <span className={className} suppressHydrationWarning>
      {text || "—"}
    </span>
  );
}
