"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { submitReview } from "@/lib/actions/customer";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea, FormMessage } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export function ReviewButton({ orderId, vendorName }: { orderId: string; vendorName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="font-semibold text-gold-600 hover:underline">Leave a review</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Review ${vendorName}`} description="Reviews are checked by Tarkaash before they appear.">
        <div className="space-y-4">
          {error && <FormMessage>{error}</FormMessage>}
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} className="p-1">
                <Star className={cn("size-8 transition", i <= rating ? "fill-gold text-gold" : "text-line")} />
              </button>
            ))}
          </div>
          <Textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you like? Anything to improve?" maxLength={1000} />
          <Button className="w-full" loading={pending} disabled={!rating} onClick={() => start(async () => {
            const r = await submitReview({ orderId, rating, body });
            if (r.ok) { setOpen(false); toast("success", "Thanks! Your review will appear after moderation."); router.refresh(); }
            else setError(r.error);
          })}>Submit review</Button>
        </div>
      </Dialog>
    </>
  );
}
