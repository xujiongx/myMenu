import { DISH_IMAGE_MAX } from "@/lib/constants/branding";

/** 从库行归一化为 URL 列表；兼容仅有 image_url 的旧数据 */
export function normalizeDishImageUrls(
  imageUrls: unknown,
  imageUrl: string | null | undefined,
): string[] {
  const fromArr = Array.isArray(imageUrls)
    ? imageUrls.filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0,
      )
    : [];
  if (fromArr.length > 0) {
    return fromArr.slice(0, DISH_IMAGE_MAX);
  }
  const cover = imageUrl?.trim();
  return cover ? [cover] : [];
}

/** 写入 dishes：同步 image_urls 与封面 image_url */
export function dishImageWritePayload(imageUrls: string[] | undefined | null): {
  image_urls: string[];
  image_url: string | null;
} {
  const urls = (imageUrls ?? [])
    .filter((u) => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, DISH_IMAGE_MAX);
  return {
    image_urls: urls,
    image_url: urls[0] ?? null,
  };
}
