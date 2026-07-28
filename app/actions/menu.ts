"use server";

import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import {
  MENU_CACHE_REVALIDATE,
} from "@/lib/constants/branding";
import { ensureDefaultCategories, menuCacheTag } from "@/lib/menu/defaults";
import { createServiceClient } from "@/lib/supabase/service";
import type { Category, Dish, MenuSnapshot } from "@/lib/types";

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type DishRow = {
  id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  price: number | string;
  description: string | null;
  status: "on" | "off";
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

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

async function loadMenuSnapshot(userId: string): Promise<MenuSnapshot> {
  const supabase = createServiceClient();
  const [catRes, dishRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("dishes")
      .select("id, category_id, name, image_url, price, description, status")
      .eq("user_id", userId)
      .eq("status", "on")
      .order("created_at", { ascending: true }),
  ]);

  if (catRes.error) throw new Error(catRes.error.message);
  if (dishRes.error) throw new Error(dishRes.error.message);

  return {
    categories: ((catRes.data ?? []) as CategoryRow[]).map(mapCategory),
    dishes: ((dishRes.data ?? []) as DishRow[]).map(mapDish),
  };
}

export async function fetchMenuSnapshot(): Promise<MenuSnapshot> {
  const user = await requireUser();
  await ensureDefaultCategories(user.id);

  const cached = unstable_cache(
    () => loadMenuSnapshot(user.id),
    ["menu-snapshot", user.id],
    {
      revalidate: MENU_CACHE_REVALIDATE,
      tags: [menuCacheTag(user.id)],
    },
  );

  return cached();
}

export async function refreshMenuCache(): Promise<void> {
  const user = await requireUser();
  revalidateTag(menuCacheTag(user.id), "max");
}
