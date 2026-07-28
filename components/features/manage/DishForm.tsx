"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageIcon } from "lucide-react";
import { createDish, updateDish } from "@/app/actions/dish-admin";
import { BackLink } from "@/components/common/BackLink";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import type { Category, Dish, DishStatus } from "@/lib/types";

export function DishForm({
  categories,
  dish,
}: {
  categories: Category[];
  dish: Dish | null;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(
    dish?.categoryId ?? categories[0]?.id ?? "",
  );
  const [name, setName] = useState(dish?.name ?? "");
  const [price, setPrice] = useState(dish ? String(dish.price) : "");
  const [description, setDescription] = useState(dish?.description ?? "");
  const [status, setStatus] = useState<DishStatus>(dish?.status ?? "on");
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json()) as {
        code: number;
        message?: string;
        data?: { url: string };
      };
      if (json.code !== 0 || !json.data?.url) {
        setError(json.message || "上传图片失败");
        return;
      }
      setImageUrl(json.data.url);
    } catch {
      setError("上传图片失败");
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    startTransition(async () => {
      const payload = {
        categoryId,
        name,
        price: priceNum,
        description,
        status,
        imageUrl: imageUrl || null,
      };
      const result = dish
        ? await updateDish(dish.id, payload)
        : await createDish(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/manage");
      router.refresh();
    });
  }

  return (
    <div className="min-h-dvh pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#fffaf2]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-3">
          <BackLink href="/manage" />
          <h1 className="font-display text-xl">
            {dish ? "编辑菜品" : "新增菜品"}
          </h1>
        </div>
        <button
          type="submit"
          form="dish-form"
          disabled={pending || uploading}
          className="text-sm font-semibold text-brand-deep"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </header>

      <form id="dish-form" onSubmit={onSubmit} className="space-y-4 px-4 py-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">菜品分类</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-1.5 block text-sm text-muted">菜品图片</span>
          <label className="flex h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-card">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-muted">
                <ImageIcon size={28} strokeWidth={1.75} aria-hidden />
                {uploading ? "上传中…" : "点击上传图片"}
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">菜品名称</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">单价（元）</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">简介（最多100字）</span>
          <textarea
            value={description}
            maxLength={100}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-brand"
          />
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm text-muted">上架状态</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={status === "on"}
                onChange={() => setStatus("on")}
              />
              上架
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={status === "off"}
                onChange={() => setStatus("off")}
              />
              下架
            </label>
          </div>
        </fieldset>

        {error ? (
          <p className="rounded-xl bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
