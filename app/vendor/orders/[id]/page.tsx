import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { getVendorOrder } from "@/lib/data/vendor";
import { OrderDetailView } from "@/components/orders/order-detail";

export const metadata: Metadata = { title: "Order" };

export default async function VendorOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireVendor();
  const { id } = await params;
  const data = await getVendorOrder(id);
  if (!data) notFound();
  return <OrderDetailView data={data} role="vendor" backHref="/vendor/orders" />;
}
