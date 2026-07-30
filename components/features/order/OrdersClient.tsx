"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { fetchMyOrders } from "@/app/actions/order";
import { PageHeader } from "@/components/common/PageHeader";
import { ICON_SIZE } from "@/lib/constants/icon-size";
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
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstSearch = useRef(true);

  function reload(next: {
    keyword: string;
    status: "all" | OrderStatus;
    append?: boolean;
    offset?: number;
  }) {
    startTransition(async () => {
      const result = await fetchMyOrders({
        offset: next.offset ?? 0,
        keyword: next.keyword.trim() || undefined,
        status: next.status,
      });
      setOrders((prev) =>
        next.append ? [...prev, ...result.orders] : result.orders,
      );
      setHasMore(result.hasMore);
    });
  }

  useEffect(() => {
    if (skipFirstSearch.current) {
      skipFirstSearch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reload({ keyword, status: filter });
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅关键字防抖；状态变更见下方
  }, [keyword]);

  function onFilterChange(next: "all" | OrderStatus) {
    setFilter(next);
    reload({ keyword, status: next });
  }

  function loadMore() {
    reload({
      keyword,
      status: filter,
      append: true,
      offset: orders.length,
    });
  }

  const isSearching = keyword.trim().length > 0;

  return (
    <div className="min-h-full bg-background pb-8">
      <PageHeader backHref="/mine" title="点菜记录" className="pb-3">
        <div className="relative mt-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索菜品名或订单号"
            className="w-full rounded-2xl border border-line bg-card py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand"
          />
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <Search size={ICON_SIZE.md} strokeWidth={2} aria-hidden />
          </span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
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
        {orders.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-sm text-muted">
            {isSearching ? "未找到相关订单" : "暂无历史订单"}
          </div>
        ) : (
          orders.map((order) => (
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

        {hasMore ? (
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
