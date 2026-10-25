"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/actions/auth";
import { Field, Input, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div>
      <h1 className="text-4xl font-semibold">Choose a new password</h1>
      <form className="mt-8 space-y-4" noValidate onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (fd.get("password") !== fd.get("confirm")) { setError("Passwords do not match."); return; }
        start(async () => {
          const r = await updatePassword({ password: String(fd.get("password")) });
          if (r.ok) { router.push(r.data.redirectTo); router.refresh(); } else setError(r.error);
        });
      }}>
        {error && <FormMessage>{error}</FormMessage>}
        <Field label="New password" name="password" hint="At least 8 characters."><Input name="password" type="password" autoComplete="new-password" /></Field>
        <Field label="Confirm password" name="confirm"><Input name="confirm" type="password" autoComplete="new-password" /></Field>
        <Button type="submit" size="lg" loading={pending} className="w-full">Update password</Button>
      </form>
    </div>
  );
}
