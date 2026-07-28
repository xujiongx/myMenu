"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { ensureDefaultCategories, menuCacheTag } from "@/lib/menu/defaults";
import { createServiceClient } from "@/lib/supabase/service";
import type { Category } from "@/lib/types";

export type CategoryManageItem = Category & {
  dishCount: number;
};

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  dishes?: { count: number }[] | null;
};

function mapCategory(row: CategoryRow): CategoryManageItem {
  const count = Array.isArray(row.dishes) ? (row.dishes[0]?.count ?? 0) : 0;
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    dishCount: count,
  };
}

function invalidate(userId: string) {
  revalidateTag(menuCacheTag(userId), "max");
  revalidatePath("/");
  revalidatePath("/manage");
  revalidatePath("/categories");
  revalidatePath("/categories/form");
}

export async function fetchCategoriesForManage(): Promise<CategoryManageItem[]> {
  const user = await requireUser();
  await ensureDefaultCategories(user.id);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order, dishes(count)")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchCategoriesForManage", error);
    throw new Error("加载分类失败");
  }

  return ((data ?? []) as CategoryRow[]).map(mapCategory);
}

export async function fetchCategoryById(
  id: string,
): Promise<CategoryManageItem | null> {
  const user = await requireUser();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order, dishes(count)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCategory(data as CategoryRow) : null;
}

export async function createCategory(input: {
  name: string;
  sortOrder?: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "请输入分类名称" };
    if (name.length > 20) return { ok: false, error: "分类名称最多 20 字" };

    const supabase = createServiceClient();
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined || Number.isNaN(sortOrder)) {
      const { data: last } = await supabase
        .from("categories")
        .select("sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (last?.sort_order ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name,
        sort_order: sortOrder,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "已存在同名分类" };
      }
      console.error("createCategory", error);
      return { ok: false, error: "新增失败，请重试" };
    }

    invalidate(user.id);
    return { ok: true, id: data.id as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "新增失败" };
  }
}

export async function updateCategory(
  id: string,
  input: { name: string; sortOrder: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "请输入分类名称" };
    if (name.length > 20) return { ok: false, error: "分类名称最多 20 字" };
    if (Number.isNaN(input.sortOrder)) {
      return { ok: false, error: "请输入排序值" };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        sort_order: input.sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "已存在同名分类" };
      }
      console.error("updateCategory", error);
      return { ok: false, error: "保存失败，请重试" };
    }
    if (!data) return { ok: false, error: "分类不存在或不属于当前账号" };

    invalidate(user.id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "保存失败" };
  }
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();

    const { count, error: countError } = await supabase
      .from("dishes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category_id", id);

    if (countError) {
      console.error("deleteCategory count", countError);
      return { ok: false, error: "删除失败，请重试" };
    }
    if ((count ?? 0) > 0) {
      return { ok: false, error: "该分类下仍有菜品，请先移走或删除菜品" };
    }

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("deleteCategory", error);
      return { ok: false, error: "分类删除失败，请重试" };
    }
    if (!data) return { ok: false, error: "分类不存在或不属于当前账号" };

    invalidate(user.id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "删除失败" };
  }
}
