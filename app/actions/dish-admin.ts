"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/app/actions/auth";
import { MENU_CACHE_TAG } from "@/lib/constants/branding";
import { createServiceClient } from "@/lib/supabase/service";
import type { Dish, DishStatus } from "@/lib/types";

type DishRow = {
  id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  price: number | string;
  description: string | null;
  status: DishStatus;
};

function mapDish(row: DishRow): Dish {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    imageUrl: row.image_url,
    price: Number(row.price),
    description: row.description,
    status: row.status,
  };
}

function invalidateMenu() {
  revalidateTag(MENU_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/manage");
}

export async function fetchDishesForManage(input?: {
  offset?: number;
  limit?: number;
  status?: DishStatus | "all";
}): Promise<{ dishes: Dish[]; hasMore: boolean }> {
  await requireAdmin();
  const offset = input?.offset ?? 0;
  const limit = Math.min(input?.limit ?? 50, 100);
  const supabase = createServiceClient();

  let query = supabase
    .from("dishes")
    .select("id, category_id, name, image_url, price, description, status")
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
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("id, category_id, name, image_url, price, description, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDish(data as DishRow) : null;
}

export async function createDish(input: {
  categoryId: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  description?: string | null;
  status?: DishStatus;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    const name = input.name.trim();
    if (!input.categoryId) return { ok: false, error: "请选择分类" };
    if (!name) return { ok: false, error: "请输入菜品名称" };
    if (Number.isNaN(input.price) || input.price < 0) {
      return { ok: false, error: "请输入正确价格" };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("dishes")
      .insert({
        category_id: input.categoryId,
        name,
        image_url: input.imageUrl || null,
        price: input.price,
        description: input.description?.trim() || null,
        status: input.status ?? "on",
        created_by: admin.id,
        updated_by: admin.id,
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

    invalidateMenu();
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "新增失败" };
  }
}

export async function updateDish(
  id: string,
  input: {
    categoryId: string;
    name: string;
    imageUrl?: string | null;
    price: number;
    description?: string | null;
    status?: DishStatus;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "请输入菜品名称" };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("dishes")
      .update({
        category_id: input.categoryId,
        name,
        image_url: input.imageUrl || null,
        price: input.price,
        description: input.description?.trim() || null,
        status: input.status ?? "on",
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "该分类下已存在同名菜品" };
      }
      console.error("updateDish", error);
      return { ok: false, error: "保存失败，请重试" };
    }

    invalidateMenu();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "保存失败" };
  }
}

export async function deleteDishes(
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (ids.length === 0) return { ok: false, error: "请选择菜品" };
    const supabase = createServiceClient();
    const { error } = await supabase.from("dishes").delete().in("id", ids);
    if (error) {
      console.error("deleteDishes", error);
      return { ok: false, error: "菜品删除失败，请重试" };
    }
    invalidateMenu();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "删除失败" };
  }
}
