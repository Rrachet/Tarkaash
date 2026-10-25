import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getVendorOrder } from "@/lib/data/vendor";
import { OrderDetailView } from "@/components/orders/order-detail";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const { id } = await params;
  const data = await getVendorOrder(id);
  if (!data) notFound();
  return <OrderDetailView data={data} role="admin" backHref="/admin/orders" />;
}
