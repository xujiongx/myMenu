"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import { createDish, updateDish } from "@/app/actions/dish-admin";
import {
  ImagePreviewHost,
  useImagePreview,
} from "@/components/common/ImagePreview";
import { PageHeader } from "@/components/common/PageHeader";
import { DISH_IMAGE_MAX } from "@/lib/constants/branding";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import { compressImageForUpload } from "@/lib/menu/compress-image";
import { dishImages } from "@/lib/menu/dish-images-client";
import type { Category, Dish, DishStatus } from "@/lib/types";

export function DishForm({
  categories,
  dish,
}: {
  categories: Category[];
  dish: Dish | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState(
    dish?.categoryId ?? categories[0]?.id ?? "",
  );
  const [name, setName] = useState(dish?.name ?? "");
  const [price, setPrice] = useState(dish ? String(dish.price) : "");
  const [description, setDescription] = useState(dish?.description ?? "");
  const [status, setStatus] = useState<DishStatus>(dish?.status ?? "on");
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    dish ? dishImages(dish) : [],
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { preview, openPreview, closePreview } = useImagePreview();

  async function uploadOne(file: File): Promise<string | null> {
    const compressed = await compressImageForUpload(file);
    const body = new FormData();
    body.append("file", compressed);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = (await res.json()) as {
      code: number;
      message?: string;
      data?: { url: string };
    };
    if (json.code !== 0 || !json.data?.url) {
      throw new Error(json.message || "上传图片失败");
    }
    return json.data.url;
  }

  async function onUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = DISH_IMAGE_MAX - imageUrls.length;
    if (room <= 0) {
      setError(`最多上传 ${DISH_IMAGE_MAX} 张图片`);
      return;
    }

    const picked = Array.from(files).slice(0, room);
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of picked) {
        const url = await uploadOne(file);
        if (url) uploaded.push(url);
      }
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, DISH_IMAGE_MAX));
      if (files.length > room) {
        setError(`最多 ${DISH_IMAGE_MAX} 张，已保留前 ${room} 张`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传图片失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
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
        imageUrls,
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
    <div className="min-h-full pb-8">
      <PageHeader
        backHref="/manage"
        title={dish ? "编辑菜品" : "新增菜品"}
        right={
          <button
            type="submit"
            form="dish-form"
            disabled={pending || uploading}
            className="text-sm font-semibold text-brand-deep"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        }
      />

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
          <span className="mb-1.5 block text-sm text-muted">
            菜品图片（最多 {DISH_IMAGE_MAX} 张，首张为封面）
          </span>
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-[#f0e9df]"
              >
                <button
                  type="button"
                  className="h-full w-full"
                  onClick={() => openPreview(imageUrls, index)}
                  aria-label={`预览第 ${index + 1} 张`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                  aria-label="删除图片"
                >
                  <X size={14} strokeWidth={2.25} aria-hidden />
                </button>
                {index === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                    封面
                  </span>
                ) : null}
              </div>
            ))}
            {imageUrls.length < DISH_IMAGE_MAX ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-card text-sm text-muted disabled:opacity-60"
              >
                <Plus size={22} strokeWidth={1.75} aria-hidden />
                <ImageIcon size={18} strokeWidth={1.75} aria-hidden />
                <span className="text-xs">
                  {uploading ? "压缩上传中…" : "添加"}
                </span>
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => onUploadFiles(e.target.files)}
          />
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

      <ImagePreviewHost preview={preview} onClose={closePreview} />
    </div>
  );
}
