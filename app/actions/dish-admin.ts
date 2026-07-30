"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { DISH_IMAGE_MAX } from "@/lib/constants/branding";
import { ensureDefaultCategories, menuCacheTag } from "@/lib/menu/defaults";
import {
  dishImageWritePayload,
  normalizeDishImageUrls,
} from "@/lib/menu/images";
import { createServiceClient } from "@/lib/supabase/service";
import type { Dish, DishStatus } from "@/lib/types";

type DishRow = {
  id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  image_urls: unknown;
  price: number | string;
  description: string | null;
  status: DishStatus;
};

const DISH_SELECT =
  "id, category_id, name, image_url, image_urls, price, description, status";

function mapDish(row: DishRow): Dish {
  const imageUrls = normalizeDishImageUrls(
    row.image_urls ?? null,
    row.image_url,
  );
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    imageUrl: imageUrls[0] ?? row.image_url ?? null,
    imageUrls,
    price: Number(row.price),
    description: row.description,
    status: row.status,
  };
}

function invalidateMenu(userId: string) {
  revalidateTag(menuCacheTag(userId), "max");
  revalidatePath("/");
  revalidatePath("/manage");
}

async function assertOwnCategory(userId: string, categoryId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("分类不存在或不属于当前账号");
}

export async function fetchDishesForManage(input?: {
  offset?: number;
  limit?: number;
  status?: DishStatus | "all";
}): Promise<{ dishes: Dish[]; hasMore: boolean }> {
  const user = await requireUser();
  await ensureDefaultCategories(user.id);
  const offset = input?.offset ?? 0;
  const limit = Math.min(input?.limit ?? 50, 100);
  const supabase = createServiceClient();

  let query = supabase
    .from("dishes")
    .select(DISH_SELECT)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit);

  if (input?.status && input.status !== "all") {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchDishesForManage", error);
    throw new Error("加载菜品失败");
  }

  const rows = (data ?? []) as DishRow[];
  const hasMore = rows.length > limit;
  const dishes = (hasMore ? rows.slice(0, limit) : rows).map(mapDish);
  return { dishes, hasMore };
}

export async function fetchDishById(id: string): Promise<Dish | null> {
  const user = await requireUser();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("dishes")
    .select(DISH_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDish(data as DishRow) : null;
}

type DishWriteInput = {
  categoryId: string;
  name: string;
  imageUrls?: string[];
  /** @deprecated 兼容旧调用；优先 imageUrls */
  imageUrl?: string | null;
  price: number;
  description?: string | null;
  status?: DishStatus;
};

function resolveImageUrls(input: DishWriteInput): string[] {
  if (input.imageUrls !== undefined) {
    return input.imageUrls;
  }
  return input.imageUrl ? [input.imageUrl] : [];
}

export async function createDish(
  input: DishWriteInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const name = input.name.trim();
    if (!input.categoryId) return { ok: false, error: "请选择分类" };
    if (!name) return { ok: false, error: "请输入菜品名称" };
    if (Number.isNaN(input.price) || input.price < 0) {
      return { ok: false, error: "请输入正确价格" };
    }

    const urls = resolveImageUrls(input);
    if (urls.length > DISH_IMAGE_MAX) {
      return { ok: false, error: `最多上传 ${DISH_IMAGE_MAX} 张图片` };
    }

    await assertOwnCategory(user.id, input.categoryId);
    const images = dishImageWritePayload(urls);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("dishes")
      .insert({
        user_id: user.id,
        category_id: input.categoryId,
        name,
        image_url: images.image_url,
        image_urls: images.image_urls,
        price: input.price,
        description: input.description?.trim() || null,
        status: input.status ?? "on",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "该分类下已存在同名菜品" };
      }
      console.error("createDish", error);
      return { ok: false, error: "新增失败，请重试" };
    }

    invalidateMenu(user.id);
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "新增失败" };
  }
}

export async function updateDish(
  id: string,
  input: DishWriteInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "请输入菜品名称" };

    const urls = resolveImageUrls(input);
    if (urls.length > DISH_IMAGE_MAX) {
      return { ok: false, error: `最多上传 ${DISH_IMAGE_MAX} 张图片` };
    }

    await assertOwnCategory(user.id, input.categoryId);
    const images = dishImageWritePayload(urls);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("dishes")
      .update({
        category_id: input.categoryId,
        name,
        image_url: images.image_url,
        image_urls: images.image_urls,
        price: input.price,
        description: input.description?.trim() || null,
        status: input.status ?? "on",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "该分类下已存在同名菜品" };
      }
      console.error("updateDish", error);
      return { ok: false, error: "保存失败，请重试" };
    }
    if (!data) return { ok: false, error: "菜品不存在或不属于当前账号" };

    invalidateMenu(user.id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "保存失败" };
  }
}

export async function deleteDishes(
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    if (ids.length === 0) return { ok: false, error: "请选择菜品" };
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("dishes")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);
    if (error) {
      console.error("deleteDishes", error);
      return { ok: false, error: "菜品删除失败，请重试" };
    }
    invalidateMenu(user.id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "删除失败" };
  }
}
