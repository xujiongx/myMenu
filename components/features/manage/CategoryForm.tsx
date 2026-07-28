"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  type CategoryManageItem,
} from "@/app/actions/category";
import { BackLink } from "@/components/common/BackLink";

export function CategoryForm({
  category,
}: {
  category: CategoryManageItem | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [sortOrder, setSortOrder] = useState(
    category ? String(category.sortOrder) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sortNum =
      sortOrder.trim() === "" ? undefined : Number(sortOrder);
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, {
            name,
            sortOrder: Number(sortOrder),
          })
        : await createCategory({
            name,
            sortOrder: sortNum,
          });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/categories");
      router.refresh();
    });
  }

  return (
    <div className="min-h-dvh pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#fffaf2]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <BackLink href="/categories" />
          <h1 className="font-display text-xl">
            {category ? "编辑分类" : "新增分类"}
          </h1>
        </div>
        <button
          type="submit"
          form="category-form"
          disabled={pending}
          className="text-sm font-semibold text-brand-deep"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </header>

      <form
        id="category-form"
        onSubmit={onSubmit}
        className="space-y-4 px-4 py-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">分类名称</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            placeholder="如：热菜"
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">
            排序（数字越小越靠前）
          </span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder={category ? undefined : "留空则自动排在末尾"}
            required={Boolean(category)}
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
