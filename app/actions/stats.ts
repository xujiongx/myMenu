"use server";

import { requireUser } from "@/app/actions/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { DishOrderRank, OrderStats } from "@/lib/types";

const COUNTED_STATUSES = ["pending", "confirmed", "completed"] as const;
const RANKING_LIMIT = 50;

type OrderRow = {
  id: string;
  total_amount: number | string;
  status: string;
  order_items:
    | {
        dish_id: string | null;
        dish_name: string;
        dish_image_url: string | null;
        quantity: number;
        line_amount: number | string;
      }[]
    | null;
};

function emptyStats(): OrderStats {
  return {
    orderCount: 0,
    totalServings: 0,
    totalSpend: 0,
    statusCounts: { pending: 0, confirmed: 0, completed: 0 },
    ranking: [],
  };
}

async function loadCountedOrders(userId: string): Promise<OrderRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, total_amount, status, order_items(dish_id, dish_name, dish_image_url, quantity, line_amount)",
    )
    .eq("user_id", userId)
    .in("status", [...COUNTED_STATUSES]);

  if (error) {
    console.error("loadCountedOrders", error);
    throw new Error(error.message);
  }

  return (data ?? []) as OrderRow[];
}

function aggregateRanking(orders: OrderRow[]): DishOrderRank[] {
  type Acc = {
    dishId: string | null;
    dishName: string;
    dishImageUrl: string | null;
    totalQuantity: number;
    totalAmount: number;
  };

  const byKey = new Map<string, Acc>();

  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      const key = item.dish_id ?? `name:${item.dish_name}`;
      const prev = byKey.get(key);
      const qty = Number(item.quantity) || 0;
      const amount = Number(item.line_amount) || 0;
      if (prev) {
        prev.totalQuantity += qty;
        prev.totalAmount += amount;
        if (!prev.dishImageUrl && item.dish_image_url) {
          prev.dishImageUrl = item.dish_image_url;
        }
      } else {
        byKey.set(key, {
          dishId: item.dish_id,
          dishName: item.dish_name,
          dishImageUrl: item.dish_image_url,
          totalQuantity: qty,
          totalAmount: amount,
        });
      }
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.totalQuantity - a.totalQuantity || b.totalAmount - a.totalAmount)
    .slice(0, RANKING_LIMIT)
    .map((row) => ({
      dishId: row.dishId,
      dishName: row.dishName,
      dishImageUrl: row.dishImageUrl,
      totalQuantity: row.totalQuantity,
      totalAmount: Math.round(row.totalAmount * 100) / 100,
    }));
}

/** 点菜页：各菜品累计已点份数（仅有 dish_id 的明细） */
export async function fetchDishOrderCounts(): Promise<Record<string, number>> {
  const user = await requireUser();
  const orders = await loadCountedOrders(user.id);
  const counts: Record<string, number> = {};

  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      if (!item.dish_id) continue;
      counts[item.dish_id] =
        (counts[item.dish_id] ?? 0) + (Number(item.quantity) || 0);
    }
  }

  return counts;
}

/** 数据统计页：汇总 + 菜品排行 */
export async function fetchOrderStats(): Promise<OrderStats> {
  const user = await requireUser();
  const orders = await loadCountedOrders(user.id);

  if (orders.length === 0) return emptyStats();

  const statusCounts = { pending: 0, confirmed: 0, completed: 0 };
  let totalSpend = 0;
  let totalServings = 0;

  for (const order of orders) {
    const status = order.status as keyof typeof statusCounts;
    if (status in statusCounts) statusCounts[status] += 1;
    totalSpend += Number(order.total_amount) || 0;
    for (const item of order.order_items ?? []) {
      totalServings += Number(item.quantity) || 0;
    }
  }

  return {
    orderCount: orders.length,
    totalServings,
    totalSpend: Math.round(totalSpend * 100) / 100,
    statusCounts,
    ranking: aggregateRanking(orders),
  };
}
