"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Props = Omit<React.ComponentProps<typeof Input>, "type">;

/** Password box with an eye button that shows or hides what was typed. */
export function PasswordInput({ className, ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...rest} type={show ? "text" : "password"} className={cn("pr-12", className)} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
        className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate hover:bg-cream hover:text-teal">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
