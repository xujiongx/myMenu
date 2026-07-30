"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { fetchMyOrders } from "@/app/actions/order";
import { PageHeader } from "@/components/common/PageHeader";
import type { OrderStatus, OrderSummary } from "@/lib/types";

const FILTERS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待支付" },
  { key: "confirmed", label: "已确认" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "待支付",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
};

export function OrdersClient({
  initialOrders,
  initialHasMore,
}: {
  initialOrders: OrderSummary[];
  initialHasMore: boolean;
}) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [orders, setOrders] = useState(initialOrders);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  function loadMore() {
    startTransition(async () => {
      const result = await fetchMyOrders({ offset: orders.length });
      setOrders((prev) => [...prev, ...result.orders]);
      setHasMore(result.hasMore);
    });
  }

  return (
    <div className="min-h-full bg-background pb-8">
      <PageHeader backHref="/mine" title="点菜记录" className="pb-3">
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                filter === f.key
                  ? "bg-brand font-semibold text-[#3b2a00]"
                  : "bg-card text-muted border border-line"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="space-y-3 px-4 py-4">
        {visible.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-sm text-muted">
            暂无历史订单
          </div>
        ) : (
          visible.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-line bg-card p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted">
                  订单 {order.id.slice(0, 8)}…
                </span>
                <span className="font-medium text-brand-deep">
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                {order.itemsPreview
                  .map((i) => `${i.dishName}×${i.quantity}`)
                  .join("、")}
                {order.itemsPreview.length >= 3 ? "…" : ""}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-xs text-muted">
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </span>
                <span className="font-semibold text-accent">
                  {order.status === "pending"
                    ? `待付 ¥${order.payableAmount.toFixed(2)}`
                    : `¥${order.totalAmount.toFixed(2)}`}
                </span>
              </div>
            </Link>
          ))
        )}

        {hasMore && filter === "all" ? (
          <button
            type="button"
            disabled={pending}
            onClick={loadMore}
            className="w-full rounded-xl border border-line bg-card py-3 text-sm text-muted"
          >
            {pending ? "加载中…" : "加载更多"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
