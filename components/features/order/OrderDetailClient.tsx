"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  cancelOrder,
  completeOrder,
  payOrder,
  removeUnpaidOrderItem,
} from "@/app/actions/order";
import { PageHeader } from "@/components/common/PageHeader";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import type { OrderDetail } from "@/lib/types";

const STATUS_LABEL = {
  pending: "待支付",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
} as const;

export function OrderDetailClient({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [removeItemId, setRemoveItemId] = useState<string | null>(null);

  function onPay() {
    startTransition(async () => {
      const result = await payOrder(order.id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("已支付，订单已确认");
      router.refresh();
    });
  }

  function onComplete() {
    startTransition(async () => {
      const result = await completeOrder(order.id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("订单已完成");
      router.refresh();
    });
  }

  function onCancel() {
    startTransition(async () => {
      const result = await cancelOrder(order.id);
      setConfirmCancel(false);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("订单已取消");
      router.refresh();
    });
  }

  function onRemoveItem(itemId: string) {
    startTransition(async () => {
      const result = await removeUnpaidOrderItem(order.id, itemId);
      setRemoveItemId(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.deletedOrder) {
        setMessage("已移除全部菜品，订单已删除");
        router.replace("/orders");
        router.refresh();
        return;
      }
      setMessage("已移除");
      router.refresh();
    });
  }

  const canAdd =
    order.status === "pending" || order.status === "confirmed";
  const canPay = order.status === "pending";
  const canComplete = order.status === "confirmed";
  const showActions = canAdd || canPay || canComplete || order.canCancel;
  const hasPartialPaid =
    order.status === "pending" && order.items.some((i) => i.paid);

  return (
    <div className="min-h-full pb-36">
      <PageHeader backHref="/orders" title="订单详情" />

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
          {order.status === "pending" ? (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">待支付</span>
              <span className="font-semibold text-accent">
                ¥{order.payableAmount.toFixed(2)}
              </span>
            </div>
          ) : null}
          {hasPartialPaid ? (
            <p className="mt-2 text-xs text-muted">
              含已支付菜品，不可取消整单；未付加菜可单独移除
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="mb-3 font-semibold">菜品明细</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.dishName}</p>
                    {order.status === "pending" ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          item.paid
                            ? "bg-success/10 text-success"
                            : "bg-brand/20 text-[#3b2a00]"
                        }`}
                      >
                        {item.paid ? "已付" : "未付"}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">
                    ¥{item.unitPrice.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-medium">
                    ¥{item.lineAmount.toFixed(2)}
                  </span>
                  {order.status === "pending" && !item.paid ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 text-xs text-danger"
                      onClick={() => setRemoveItemId(item.id)}
                    >
                      <Trash2 size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                      移除
                    </button>
                  ) : null}
                </div>
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
      </div>

      {showActions ? (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            className={`grid gap-3 ${
              canAdd && (canPay || canComplete) ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {canAdd ? (
              <Link
                href={`/orders/${order.id}/add`}
                className="rounded-2xl border border-line py-3 text-center text-sm font-semibold"
              >
                加菜
              </Link>
            ) : null}
            {canPay ? (
              <button
                type="button"
                disabled={pending}
                onClick={onPay}
                className="tap-primary rounded-2xl bg-brand py-3 text-sm font-semibold text-[#3b2a00]"
              >
                {pending ? "处理中…" : "去支付"}
              </button>
            ) : null}
            {canComplete ? (
              <button
                type="button"
                disabled={pending}
                onClick={onComplete}
                className="tap-primary rounded-2xl bg-brand py-3 text-sm font-semibold text-[#3b2a00]"
              >
                {pending ? "处理中…" : "已完成"}
              </button>
            ) : null}
          </div>
          {order.canCancel ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmCancel(true)}
              className="mt-3 w-full rounded-2xl border border-danger/30 py-2.5 text-sm text-danger"
            >
              取消订单
            </button>
          ) : null}
        </div>
      ) : null}

      {confirmCancel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-card p-5">
            <p className="text-center">确定取消该订单吗？</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-xl border border-line py-2.5"
              >
                返回
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onCancel}
                className="rounded-xl bg-danger py-2.5 text-white"
              >
                {pending ? "取消中…" : "确定取消"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {removeItemId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-card p-5">
            <p className="text-center">确定移除该未付菜品吗？</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRemoveItemId(null)}
                className="rounded-xl border border-line py-2.5"
              >
                返回
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemoveItem(removeItemId)}
                className="rounded-xl bg-danger py-2.5 text-white"
              >
                {pending ? "移除中…" : "移除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <button
          type="button"
          className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-[#2b2118]/90 px-4 py-2 text-sm text-white"
          onClick={() => setMessage(null)}
        >
          {message}
        </button>
      ) : null}
    </div>
  );
}
