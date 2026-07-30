"use client";

import { Minus, Plus, X } from "lucide-react";
import { DishImageCarousel } from "@/components/common/DishImageCarousel";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import { dishImages } from "@/lib/menu/dish-images-client";
import type { Dish } from "@/lib/types";

type Props = {
  dish: Dish;
  quantity: number;
  orderedCount?: number;
  onClose: () => void;
  onChangeQty: (delta: number) => void;
  onPreviewImage?: (urls: string[], index: number) => void;
};

export function DishDetailModal({
  dish,
  quantity,
  orderedCount = 0,
  onClose,
  onChangeQty,
  onPreviewImage,
}: Props) {
  const urls = dishImages(dish);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-detail-title"
      onClick={onClose}
    >
      <div
        className="animate-dish-sheet w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:mx-4 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <DishImageCarousel
            urls={urls}
            alt={dish.name}
            onPreview={(index) => onPreviewImage?.(urls, index)}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"
            aria-label="关闭"
          >
            <X size={ICON_SIZE.close} strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="dish-detail-title"
              className="font-display text-2xl leading-tight"
            >
              {dish.name}
            </h2>
            <span className="shrink-0 text-lg font-semibold text-accent">
              ¥{dish.price.toFixed(2)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {dish.description || "暂无简介"}
          </p>
          {orderedCount > 0 ? (
            <p className="mt-2 text-xs text-brand-deep">已点 {orderedCount} 次</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeQty(-1)}
                disabled={quantity <= 0}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted disabled:opacity-30"
                aria-label="减少"
              >
                <Minus size={ICON_SIZE.md} strokeWidth={2.25} aria-hidden />
              </button>
              <span className="w-6 text-center text-base font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQty(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[#3b2a00]"
                aria-label="增加"
              >
                <Plus size={ICON_SIZE.md} strokeWidth={2.25} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (quantity <= 0) onChangeQty(1);
                onClose();
              }}
              className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-[#3b2a00]"
            >
              {quantity > 0 ? "选好了" : "加入购物车"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
