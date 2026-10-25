"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReview, updateTicket } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ModerateButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const act = (s: "approved" | "rejected") => start(async () => {
    const r = await moderateReview(id, s);
    if (r.ok) { toast("success", s === "approved" ? "Review published" : "Review rejected"); router.refresh(); } else toast("error", r.error);
  });
  return (
    <div className="mt-4 flex gap-2">
      <Button size="sm" loading={pending} onClick={() => act("approved")}>Approve</Button>
      <Button size="sm" variant="ghost" className="text-danger" loading={pending} onClick={() => act("rejected")}>Reject</Button>
    </div>
  );
}

export function TicketButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const act = (s: "in_progress" | "resolved" | "closed" | "open", me = false) => start(async () => { await updateTicket(id, s, me); router.refresh(); });
  return (
    <div className="flex flex-wrap gap-2">
      {status === "open" && <Button size="sm" variant="outline" loading={pending} onClick={() => act("in_progress", true)}>Take it</Button>}
      {["open", "in_progress"].includes(status) && <Button size="sm" loading={pending} onClick={() => act("resolved")}>Resolve</Button>}
      {status === "resolved" && <Button size="sm" variant="ghost" loading={pending} onClick={() => act("open")}>Reopen</Button>}
    </div>
  );
}
