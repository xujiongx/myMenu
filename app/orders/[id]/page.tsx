import { notFound, redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchOrderDetail } from "@/app/actions/order";
import { OrderDetailClient } from "@/components/features/order/OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  const { id } = await params;
  const order = await fetchOrderDetail(id);
  if (!order) notFound();

  return <OrderDetailClient order={order} />;
}
