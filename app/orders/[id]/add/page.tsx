import { notFound, redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchMenuSnapshot } from "@/app/actions/menu";
import { fetchOrderDetail } from "@/app/actions/order";
import { MenuClient } from "@/components/features/menu/MenuClient";

export default async function OrderAddPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect("/login");

  const { id } = await params;
  const order = await fetchOrderDetail(id);
  if (!order) notFound();
  if (order.status !== "pending" && order.status !== "confirmed") {
    redirect(`/orders/${id}`);
  }

  let categories = [] as Awaited<ReturnType<typeof fetchMenuSnapshot>>["categories"];
  let dishes = [] as Awaited<ReturnType<typeof fetchMenuSnapshot>>["dishes"];
  let error: string | null = null;

  try {
    const snapshot = await fetchMenuSnapshot();
    categories = snapshot.categories;
    dishes = snapshot.dishes;
  } catch (e) {
    console.error(e);
    error = e instanceof Error ? e.message : "加载菜单失败";
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted">网络异常，请重试</p>
        <p className="text-xs text-muted/80">{error}</p>
      </div>
    );
  }

  return (
    <MenuClient
      categories={categories}
      dishes={dishes}
      orderId={id}
    />
  );
}
