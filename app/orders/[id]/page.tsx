import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserAction } from "@/app/actions/auth";
import { fetchOrderDetail } from "@/app/actions/order";
import { BackLink } from "@/components/common/BackLink";

const STATUS_LABEL = {
  pending: "待支付",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
} as const;

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

  return (
    <div className="min-h-dvh pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[#fffaf2]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <BackLink href="/orders" />
        <h1 className="font-display text-xl">订单详情</h1>
      </header>

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">状态</span>
            <span className="font-medium text-brand-deep">
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">下单时间</span>
            <span>{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">订单号</span>
            <span className="max-w-[60%] truncate">{order.id}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="mb-3 font-semibold">菜品明细</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{item.dishName}</p>
                  <p className="text-xs text-muted">
                    ¥{item.unitPrice.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-medium">
                  ¥{item.lineAmount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm text-muted">合计</span>
            <span className="text-lg font-semibold text-accent">
              ¥{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </section>

        <Link
          href="/orders"
          className="block rounded-2xl bg-brand py-3 text-center font-semibold text-[#3b2a00]"
        >
          返回列表
        </Link>
      </div>
    </div>
  );
}
