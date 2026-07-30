"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCategory,
  type CategoryManageItem,
} from "@/app/actions/category";
import { PageHeader } from "@/components/common/PageHeader";
import { ICON_SIZE } from "@/lib/constants/icon-size";

export function CategoryManageClient({
  categories: initial,
}: {
  categories: CategoryManageItem[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      setConfirmId(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage("已删除");
      router.refresh();
    });
  }

  return (
    <div className="min-h-full pb-24">
      <PageHeader backHref="/mine" title="分类管理" />

      <div className="space-y-3 px-4 py-4">
        {categories.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-sm text-muted">
            暂无分类，请先新增
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  排序 {cat.sortOrder} · {cat.dishCount} 道菜
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <Link
                  href={`/categories/form?id=${cat.id}`}
                  className="inline-flex items-center gap-1 text-brand-deep"
                >
                  <Pencil size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                  编辑
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-danger"
                  onClick={() => setConfirmId(cat.id)}
                >
                  <Trash2 size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/categories/form"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-brand py-3 text-center font-semibold text-[#3b2a00]"
        >
          <Plus size={ICON_SIZE.md} strokeWidth={2.25} aria-hidden />
          新增分类
        </Link>
      </div>

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-card p-5">
            <p className="text-center">确定删除该分类吗？</p>
            <p className="mt-2 text-center text-xs text-muted">
              若分类下仍有菜品将无法删除
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-xl border border-line py-2.5"
              >
                取消
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete(confirmId)}
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
    </div>
  );
}
