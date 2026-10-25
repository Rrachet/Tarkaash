"use client";

import { useEffect, useRef } from "react";
import { logEvent } from "@/lib/actions/public";
import { getSessionId } from "@/lib/session";

type Props = {
  type: "profile_view" | "search" | "category_view" | "service_view";
  vendorId?: string;
  serviceId?: string;
  source?: string;
  meta?: Record<string, string | number | boolean>;
};

/** Logs one analytics event per mount. */
export function TrackEvent({ type, vendorId, serviceId, source, meta }: Props) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const ref = document.referrer;
    const derived = source ?? (ref.includes("/services") ? "search" : ref.includes(location.host) ? "home_recommended" : ref ? "external" : "direct");
    void logEvent({ type, vendorId, serviceId, source: derived, sessionId: getSessionId(), path: location.pathname, meta });
  }, [type, vendorId, serviceId, source, meta]);
  return null;
}
