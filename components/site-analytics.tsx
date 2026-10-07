"use client";

import { Analytics } from "@vercel/analytics/react";
import { publicAnalyticsEvent } from "@/lib/analytics";

export function SiteAnalytics() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1") ? null : <Analytics beforeSend={publicAnalyticsEvent} />;
}
