import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchMyOrders } from "@/app/actions/order";
import { OrdersClient } from "@/components/features/order/OrdersClient";

export default async function OrdersPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");
  const { orders, hasMore } = await fetchMyOrders();
  return <OrdersClient initialOrders={orders} initialHasMore={hasMore} />;
}
