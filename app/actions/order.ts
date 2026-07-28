"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { ORDER_PAGE_SIZE } from "@/lib/constants/branding";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderDetail, OrderSummary } from "@/lib/types";

type CreateOrderInput = {
  items: { dishId: string; quantity: number }[];
  remark?: string;
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ ok: true; orderId: string; totalAmount: number } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const items = (input.items ?? []).filter((i) => i.quantity > 0);
    if (items.length === 0) {
      return { ok: false, error: "请先选择菜品" };
    }

    const supabase = createServiceClient();
    const dishIds = items.map((i) => i.dishId);
    const { data: dishes, error } = await supabase
      .from("dishes")
      .select("id, name, image_url, price, status")
      .in("id", dishIds);

    if (error) {
      console.error("createOrder dishes", error);
      return { ok: false, error: "网络异常，请重试" };
    }

    const dishMap = new Map(
      (dishes ?? []).map((d) => [
        d.id as string,
        d as {
          id: string;
          name: string;
          image_url: string | null;
          price: number | string;
          status: string;
        },
      ]),
    );

    const lines: {
      dish_id: string;
      dish_name: string;
      dish_image_url: string | null;
      unit_price: number;
      quantity: number;
      line_amount: number;
    }[] = [];

    let total = 0;
    for (const item of items) {
      const dish = dishMap.get(item.dishId);
      if (!dish || dish.status !== "on") {
        return { ok: false, error: "部分菜品已下架，请刷新后重试" };
      }
      const unit = Number(dish.price);
      const line = unit * item.quantity;
      total += line;
      lines.push({
        dish_id: dish.id,
        dish_name: dish.name,
        dish_image_url: dish.image_url,
        unit_price: unit,
        quantity: item.quantity,
        line_amount: line,
      });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: total,
        status: "confirmed",
        remark: input.remark?.trim() || null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("createOrder insert", orderErr);
      return { ok: false, error: "下单失败，请重试" };
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      lines.map((line) => ({
        order_id: order.id,
        ...line,
      })),
    );

    if (itemsErr) {
      console.error("createOrder items", itemsErr);
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, error: "下单失败，请重试" };
    }

    revalidatePath("/orders");
    return { ok: true, orderId: order.id as string, totalAmount: total };
  } catch (e) {
    const message = e instanceof Error ? e.message : "下单失败";
    return { ok: false, error: message };
  }
}

export async function fetchMyOrders(input?: {
  offset?: number;
  limit?: number;
}): Promise<{ orders: OrderSummary[]; hasMore: boolean }> {
  const user = await requireUser();
  const offset = input?.offset ?? 0;
  const limit = Math.min(input?.limit ?? ORDER_PAGE_SIZE, 50);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, total_amount, status, created_at, order_items(dish_name, quantity)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error("fetchMyOrders", error);
    throw new Error("加载订单失败");
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  const orders: OrderSummary[] = sliced.map((row) => {
    const items = (row.order_items ?? []) as {
      dish_name: string;
      quantity: number;
    }[];
    return {
      id: row.id as string,
      totalAmount: Number(row.total_amount),
      status: row.status as OrderSummary["status"],
      createdAt: row.created_at as string,
      itemsPreview: items.slice(0, 3).map((i) => ({
        dishName: i.dish_name,
        quantity: i.quantity,
      })),
    };
  });

  return { orders, hasMore };
}

export async function fetchOrderDetail(
  orderId: string,
): Promise<OrderDetail | null> {
  const user = await requireUser();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, total_amount, status, remark, created_at, user_id, order_items(id, dish_id, dish_name, dish_image_url, unit_price, quantity, line_amount)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("fetchOrderDetail", error);
    throw new Error("加载订单失败");
  }
  if (!data) return null;
  if (data.user_id !== user.id && user.role !== "admin") {
    throw new Error("当前账号无管理权限");
  }

  const items = (
    (data.order_items ?? []) as {
      id: string;
      dish_id: string | null;
      dish_name: string;
      dish_image_url: string | null;
      unit_price: number | string;
      quantity: number;
      line_amount: number | string;
    }[]
  ).map((i) => ({
    id: i.id,
    dishId: i.dish_id,
    dishName: i.dish_name,
    dishImageUrl: i.dish_image_url,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
    lineAmount: Number(i.line_amount),
  }));

  return {
    id: data.id as string,
    totalAmount: Number(data.total_amount),
    status: data.status as OrderDetail["status"],
    remark: (data.remark as string | null) ?? null,
    createdAt: data.created_at as string,
    items,
  };
}
