import { createServiceClient } from "@/lib/supabase/service";

export const DEFAULT_CATEGORY_NAMES: { name: string; sortOrder: number }[] = [
  { name: "招牌推荐", sortOrder: 1 },
  { name: "热菜", sortOrder: 2 },
  { name: "凉菜", sortOrder: 3 },
  { name: "汤品", sortOrder: 4 },
  { name: "主食", sortOrder: 5 },
  { name: "饮品", sortOrder: 6 },
  { name: "小吃", sortOrder: 7 },
];

/** 新用户首次进入时补齐默认分类（幂等） */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("ensureDefaultCategories count", error);
    throw new Error("初始化分类失败");
  }
  if ((count ?? 0) > 0) return;

  const { error: insertError } = await supabase.from("categories").insert(
    DEFAULT_CATEGORY_NAMES.map((c) => ({
      user_id: userId,
      name: c.name,
      sort_order: c.sortOrder,
    })),
  );

  if (insertError) {
    console.error("ensureDefaultCategories insert", insertError);
    throw new Error("初始化分类失败");
  }
}

export function menuCacheTag(userId: string) {
  return `menu:${userId}`;
}
