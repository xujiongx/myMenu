import type { Dish } from "@/lib/types";

/** 客户端安全取图列表（兼容缓存/旧快照缺 imageUrls） */
export function dishImages(dish: {
  imageUrls?: string[] | null;
  imageUrl?: string | null;
}): string[] {
  if (Array.isArray(dish.imageUrls) && dish.imageUrls.length > 0) {
    return dish.imageUrls.filter((u) => typeof u === "string" && u.length > 0);
  }
  return dish.imageUrl ? [dish.imageUrl] : [];
}

export function dishCover(dish: Pick<Dish, "imageUrl"> & { imageUrls?: string[] | null }): string | null {
  return dishImages(dish)[0] ?? null;
}
