"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, BellPlus, BellRing, Share2 } from "lucide-react";
import { toggleReaction } from "@/lib/actions/public";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export function ReactionButtons({ vendorId, name, initial }: { vendorId: string; name: string; initial: { liked: boolean; following: boolean; signedIn: boolean } }) {
  const [liked, setLiked] = useState(initial.liked);
  const [following, setFollowing] = useState(initial.following);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const act = (kind: "like" | "follow") => {
    if (!initial.signedIn) {
      router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const next = kind === "like" ? !liked : !following;
    if (kind === "like") setLiked(next); else setFollowing(next);
    start(async () => {
      const r = await toggleReaction(kind, vendorId, next);
      if (!r.ok) {
        if (kind === "like") setLiked(!next); else setFollowing(!next);
        toast("error", r.error);
      } else {
        toast("success", kind === "like" ? (next ? `Saved ${name}` : "Removed from saved") : next ? `You'll get updates from ${name}` : "Unfollowed");
      }
    });
  };

  const share = async () => {
    const data = { title: name, text: `${name} on Tarkkash`, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); toast("success", "Link copied"); }
    } catch { /* cancelled */ }
  };

  const btn = "flex size-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 transition hover:bg-white/20";
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => act("like")} disabled={pending} aria-pressed={liked} aria-label={liked ? "Remove from saved" : "Save provider"} className={btn}>
        <Heart className={cn("size-5", liked && "fill-gold text-gold")} />
      </button>
      <button type="button" onClick={() => act("follow")} disabled={pending} aria-pressed={following} aria-label={following ? "Unfollow updates" : "Follow for updates"} className={btn}>
        {following ? <BellRing className="size-5 text-gold" /> : <BellPlus className="size-5" />}
      </button>
      <button type="button" onClick={share} aria-label="Share profile" className={btn}><Share2 className="size-5" /></button>
    </div>
  );
}
