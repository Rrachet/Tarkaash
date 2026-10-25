import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SeriesPoint = { date: string; views: number; enquiries?: number; orders?: number; leads?: number; accepted?: number; completed?: number };

export type VendorMetrics = {
  period: { from: string; to: string };
  generated_at: string;
  profile_views: number; unique_viewers: number; enquiries: number; assigned: number; accepted: number; declined: number;
  pending_response: number; completed: number; cancelled: number; closed: number;
  acceptance_rate: number | null; conversion_rate: number | null; completion_rate: number | null;
  median_response_minutes: number | null; response_sample: number;
  order_value: number; payments_recorded: number;
  likes_total: number; likes_new: number; followers_total: number; followers_new: number; update_subscribers: number;
  rating_avg: number | null; rating_count: number; completeness: number;
  series: SeriesPoint[];
  top_services: { id: string; title: string; views: number; enquiries: number; orders: number }[];
  sources: { source: string; count: number }[];
  status_breakdown: Record<string, number>;
};

export type AdminMetrics = {
  period: { from: string; to: string };
  generated_at: string;
  active_vendors: number; pending_vendors: number; verified_vendors: number; categories_total: number; categories_covered: number;
  profile_views: number; searches: number; leads: number; unassigned: number; assigned: number; accepted: number; declined: number;
  completed: number; cancelled: number; closed: number;
  acceptance_rate: number | null; conversion_rate: number | null; completion_rate: number | null;
  median_response_minutes: number | null; response_sample: number; rating_avg: number | null; rating_count: number; gmv: number;
  series: SeriesPoint[];
  by_category: { id: string; name: string; vendors: number; leads: number; accepted: number; completed: number }[];
  top_vendors: { id: string; name: string; slug: string; locality: string; views: number; leads: number; accepted: number; completed: number; value: number }[];
  enquiry_status: Record<string, number>;
  sources: { source: string; count: number }[];
};

export type BoostItem = {
  vendor_id: string; vendor_name: string; vendor_slug: string;
  rule: "low_exposure" | "low_conversion" | "slow_response" | "quality_risk" | "incomplete_listing";
  severity: "risk" | "improve" | "opportunity"; reason: string; action: string;
  metrics: Record<string, number>;
};

export type CommercialSummary = {
  period: { from: string; to: string };
  generated_at: string;
  revenue: number; revenue_actual: number; revenue_accrued: number; revenue_forecast: number; tax: number;
  direct_costs: number; operating_costs: number; contribution: number; operating_result: number;
  unreconciled: number; gmv: number;
  revenue_by_type: Record<string, number>; revenue_by_basis: Record<string, number>;
  monthly: { month: string; revenue: number; direct: number; operating: number }[];
};

export async function getVendorMetrics(vendorId: string, from: string, to: string): Promise<VendorMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("vendor_metrics", { p_vendor: vendorId, p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return data as unknown as VendorMetrics;
}

export async function getAdminMetrics(from: string, to: string, filters: { categoryId?: string; locality?: string; vendorId?: string } = {}): Promise<AdminMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_metrics", {
    p_from: from, p_to: to, p_category: filters.categoryId, p_locality: filters.locality, p_vendor: filters.vendorId,
  });
  if (error) throw new Error(error.message);
  return data as unknown as AdminMetrics;
}

export async function getBoostQueue(from: string, to: string): Promise<BoostItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("boost_queue", { p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BoostItem[];
}

export async function getCommercialSummary(from: string, to: string): Promise<CommercialSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("commercial_summary", { p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return data as unknown as CommercialSummary;
}
