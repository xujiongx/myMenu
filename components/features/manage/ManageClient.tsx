"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteDishes } from "@/app/actions/dish-admin";
import {
  ImagePreviewHost,
  useImagePreview,
} from "@/components/common/ImagePreview";
import { PageHeader } from "@/components/common/PageHeader";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import { dishImages } from "@/lib/menu/dish-images-client";
import type { Category, Dish } from "@/lib/types";

export function ManageClient({
  dishes: initial,
  categories,
}: {
  dishes: Dish[];
  categories: Category[];
}) {
  const router = useRouter();
  const [dishes, setDishes] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { preview, openPreview, closePreview } = useImagePreview();

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "未分类";

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onDelete(ids: string[]) {
    startTransition(async () => {
      const result = await deleteDishes(ids);
      setConfirmIds(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setDishes((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSelected(new Set());
      setMessage("已删除");
      router.refresh();
    });
  }

  return (
    <div className="min-h-full pb-24">
      <PageHeader
        backHref="/mine"
        title="我的菜单"
        right={
          selected.size > 0 ? (
            <button
              type="button"
              onClick={() => setConfirmIds([...selected])}
              className="inline-flex items-center gap-1 text-sm text-danger"
            >
              <Trash2 size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
              批量删除
            </button>
          ) : null
        }
      />

      <div className="space-y-3 px-4 py-4">
        {dishes.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-sm text-muted">
            暂无菜品数据
          </div>
        ) : (
          dishes.map((dish) => (
            <div
              key={dish.id}
              className="flex gap-3 rounded-2xl border border-line bg-card p-3 shadow-sm"
            >
              <input
                placeholder="选择"
                title="选择"
                aria-label="选择"
                type="checkbox"
                checked={selected.has(dish.id)}
                onChange={() => toggle(dish.id)}
                className="mt-8 accent-brand-deep"
              />
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f0e9df]">
                {dish.imageUrl ? (
                  <button
                    type="button"
                    className="h-full w-full"
                    onClick={() => {
                      const urls = dishImages(dish);
                      if (urls.length > 0) openPreview(urls, 0);
                    }}
                    aria-label="预览图片"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </button>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    <ImageIcon size={ICON_SIZE.lg} strokeWidth={1.75} aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{dish.name}</h3>
                    <p className="text-xs text-muted">
                      {categoryName(dish.categoryId)} · ¥
                      {dish.price.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      dish.status === "on"
                        ? "bg-success/10 text-success"
                        : "bg-muted/15 text-muted"
                    }`}
                  >
                    {dish.status === "on" ? "上架" : "下架"}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <Link
                    href={`/manage/dish?id=${dish.id}`}
                    className="inline-flex items-center gap-1 text-brand-deep"
                  >
                    <Pencil size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                    编辑
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-danger"
                    onClick={() => setConfirmIds([dish.id])}
                  >
                    <Trash2 size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/manage/dish"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-brand py-3 text-center font-semibold text-[#3b2a00]"
        >
          <Plus size={ICON_SIZE.md} strokeWidth={2.25} aria-hidden />
          新增菜品
        </Link>
      </div>

      {confirmIds ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-card p-5">
            <p className="text-center">确定删除所选菜品吗？</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmIds(null)}
                className="rounded-xl border border-line py-2.5"
              >
                取消
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete(confirmIds)}
                className="rounded-xl bg-danger py-2.5 text-white"
              >
                {pending ? "删除中…" : "删除"}
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

      <ImagePreviewHost preview={preview} onClose={closePreview} />
    </div>
  );
}
