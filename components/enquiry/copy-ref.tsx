"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button"
      onClick={() => navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-teal transition hover:bg-teal/5">
      {copied ? <><Check className="size-3.5" />Copied</> : <><Copy className="size-3.5" />Copy reference</>}
    </button>
  );
}
