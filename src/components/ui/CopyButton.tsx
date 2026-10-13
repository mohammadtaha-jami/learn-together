"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function CopyButton({
  text,
  label = "کپی",
  className,
  variant = "accent",
}: {
  text: string;
  label?: string;
  className?: string;
  variant?: "accent" | "secondary" | "primary";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(buttonVariants({ variant, size: "md" }), className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" /> کپی شد
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> {label}
        </>
      )}
    </button>
  );
}
