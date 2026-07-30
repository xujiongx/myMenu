"use client";

import { ImageIcon } from "lucide-react";
import {
  ImagePreviewHost,
  useImagePreview,
} from "@/components/common/ImagePreview";
import { PageHeader } from "@/components/common/PageHeader";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import type { OrderStats } from "@/lib/types";

export function StatsClient({ stats }: { stats: OrderStats }) {
  const { statusCounts, ranking } = stats;
  const { preview, openPreview, closePreview } = useImagePreview();

  return (
    <div className="min-h-full bg-background pb-8">
      <PageHeader backHref="/mine" title="数据统计" />

      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-line bg-card px-3 py-3 text-center shadow-sm">
            <p className="text-[11px] text-muted">订单数</p>
            <p className="mt-1 text-xl font-semibold text-brand-deep">
              {stats.orderCount}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-card px-3 py-3 text-center shadow-sm">
            <p className="text-[11px] text-muted">总份数</p>
            <p className="mt-1 text-xl font-semibold text-brand-deep">
              {stats.totalServings}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-card px-3 py-3 text-center shadow-sm">
            <p className="text-[11px] text-muted">消费额</p>
            <p className="mt-1 text-lg font-semibold text-accent">
              ¥{stats.totalSpend.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full border border-line bg-card px-2.5 py-1">
            待支付 {statusCounts.pending}
          </span>
          <span className="rounded-full border border-line bg-card px-2.5 py-1">
            已确认 {statusCounts.confirmed}
          </span>
          <span className="rounded-full border border-line bg-card px-2.5 py-1">
            已完成 {statusCounts.completed}
          </span>
        </div>

        <section>
          <h2 className="mb-2 px-0.5 text-sm font-semibold text-muted">
            菜品下单排行
          </h2>
          {ranking.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-line bg-card text-sm text-muted">
              暂无点菜数据
            </div>
          ) : (
            <ul className="space-y-2">
              {ranking.map((row, index) => (
                <li
                  key={row.dishId ?? `${row.dishName}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-sm"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index < 3
                        ? "bg-brand text-[#3b2a00]"
                        : "bg-[#f0e9df] text-muted"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f0e9df]">
                    {row.dishImageUrl ? (
                      <button
                        type="button"
                        className="h-full w-full"
                        onClick={() => openPreview([row.dishImageUrl!], 0)}
                        aria-label="预览图片"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.dishImageUrl}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted">
                        <ImageIcon
                          size={ICON_SIZE.md}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {row.dishName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      已点 {row.totalQuantity} 份
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-accent">
                    ¥{row.totalAmount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="px-1 text-[11px] leading-relaxed text-muted">
          统计含待支付、已确认、已完成订单；已取消不计入。
        </p>
      </div>

      <ImagePreviewHost preview={preview} onClose={closePreview} />
    </div>
  );
}
