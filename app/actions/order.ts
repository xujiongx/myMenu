"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { ORDER_PAGE_SIZE } from "@/lib/constants/branding";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderDetail, OrderStatus, OrderSummary } from "@/lib/types";

type LineInput = { dishId: string; quantity: number };

type DishRow = {
  id: string;
  name: string;
  image_url: string | null;
  price: number | string;
  status: string;
};

type BuiltLine = {
  dish_id: string;
  dish_name: string;
  dish_image_url: string | null;
  unit_price: number;
  quantity: number;
  line_amount: number;
};

async function buildLines(
  userId: string,
  items: LineInput[],
): Promise<
  | { ok: true; lines: BuiltLine[]; total: number }
  | { ok: false; error: string }
> {
  const filtered = items.filter((i) => i.quantity > 0);
  if (filtered.length === 0) {
    return { ok: false, error: "请先选择菜品" };
  }

  const supabase = createServiceClient();
  const dishIds = filtered.map((i) => i.dishId);
  const { data: dishes, error } = await supabase
    .from("dishes")
    .select("id, name, image_url, price, status")
    .eq("user_id", userId)
    .in("id", dishIds);

  if (error) {
    console.error("buildLines dishes", error);
    return { ok: false, error: "网络异常，请重试" };
  }

  const dishMap = new Map(
    (dishes ?? []).map((d) => [d.id as string, d as DishRow]),
  );

  const lines: BuiltLine[] = [];
  let total = 0;
  for (const item of filtered) {
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

  return { ok: true, lines, total };
}

export async function createOrder(input: {
  items: LineInput[];
  remark?: string;
}): Promise<
  { ok: true; orderId: string; totalAmount: number } | { ok: false; error: string }
> {
  try {
    const user = await requireUser();
    const built = await buildLines(user.id, input.items ?? []);
    if (!built.ok) return built;

    const supabase = createServiceClient();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: built.total,
        payable_amount: built.total,
        status: "pending",
        remark: input.remark?.trim() || null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("createOrder insert", orderErr);
      return { ok: false, error: "下单失败，请重试" };
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      built.lines.map((line) => ({
        order_id: order.id,
        ...line,
        paid: false,
      })),
    );

    if (itemsErr) {
      console.error("createOrder items", itemsErr);
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, error: "下单失败，请重试" };
    }

    revalidatePath("/orders");
    return { ok: true, orderId: order.id as string, totalAmount: built.total };
  } catch (e) {
    const message = e instanceof Error ? e.message : "下单失败";
    return { ok: false, error: message };
  }
}

export async function addOrderItems(
  orderId: string,
  input: { items: LineInput[] },
): Promise<
  | { ok: true; addedAmount: number; orderId: string }
  | { ok: false; error: string }
> {
  try {
    const user = await requireUser();
    const built = await buildLines(user.id, input.items ?? []);
    if (!built.ok) return built;

    const supabase = createServiceClient();
    const { data: order, error: loadErr } = await supabase
      .from("orders")
      .select("id, user_id, status, total_amount, payable_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (loadErr) {
      console.error("addOrderItems load", loadErr);
      return { ok: false, error: "加载订单失败" };
    }
    if (!order || order.user_id !== user.id) {
      return { ok: false, error: "订单不存在" };
    }
    if (order.status !== "pending" && order.status !== "confirmed") {
      return { ok: false, error: "当前订单状态不可加菜" };
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      built.lines.map((line) => ({
        order_id: orderId,
        ...line,
        paid: false,
      })),
    );
    if (itemsErr) {
      console.error("addOrderItems items", itemsErr);
      return { ok: false, error: "加菜失败，请重试" };
    }

    const nextTotal = Number(order.total_amount) + built.total;
    const wasConfirmed = order.status === "confirmed";
    const nextPayable = wasConfirmed
      ? built.total
      : Number(order.payable_amount) + built.total;

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        total_amount: nextTotal,
        payable_amount: nextPayable,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("addOrderItems update", updateErr);
      return { ok: false, error: "加菜失败，请重试" };
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true, addedAmount: built.total, orderId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "加菜失败";
    return { ok: false, error: message };
  }
}

export async function payOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("payOrder load", error);
      return { ok: false, error: "加载订单失败" };
    }
    if (!order || order.user_id !== user.id) {
      return { ok: false, error: "订单不存在" };
    }
    if (order.status !== "pending") {
      return { ok: false, error: "仅待支付订单可去支付" };
    }

    const { error: payItemsErr } = await supabase
      .from("order_items")
      .update({ paid: true })
      .eq("order_id", orderId)
      .eq("paid", false);
    if (payItemsErr) {
      console.error("payOrder items", payItemsErr);
      return { ok: false, error: "支付失败，请重试" };
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        payable_amount: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("payOrder update", updateErr);
      return { ok: false, error: "支付失败，请重试" };
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "支付失败";
    return { ok: false, error: message };
  }
}

export async function completeOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("completeOrder load", error);
      return { ok: false, error: "加载订单失败" };
    }
    if (!order || order.user_id !== user.id) {
      return { ok: false, error: "订单不存在" };
    }
    if (order.status !== "confirmed") {
      return { ok: false, error: "仅已确认订单可标记完成" };
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("completeOrder update", updateErr);
      return { ok: false, error: "操作失败，请重试" };
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "操作失败";
    return { ok: false, error: message };
  }
}

/** 待支付且无已付明细时可取消整单 */
export async function cancelOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("cancelOrder load", error);
      return { ok: false, error: "加载订单失败" };
    }
    if (!order || order.user_id !== user.id) {
      return { ok: false, error: "订单不存在" };
    }
    if (order.status !== "pending") {
      return { ok: false, error: "仅待支付订单可取消" };
    }

    const { count, error: countErr } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId)
      .eq("paid", true);
    if (countErr) {
      console.error("cancelOrder count", countErr);
      return { ok: false, error: "加载订单失败" };
    }
    if ((count ?? 0) > 0) {
      return { ok: false, error: "已有已支付菜品，不可取消整单" };
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payable_amount: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("cancelOrder update", updateErr);
      return { ok: false, error: "取消失败，请重试" };
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "取消失败";
    return { ok: false, error: message };
  }
}

/** 移除未支付明细（加菜未付） */
export async function removeUnpaidOrderItem(
  orderId: string,
  itemId: string,
): Promise<
  | { ok: true; deletedOrder?: boolean }
  | { ok: false; error: string }
> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, user_id, status, total_amount, payable_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("removeUnpaidOrderItem load", error);
      return { ok: false, error: "加载订单失败" };
    }
    if (!order || order.user_id !== user.id) {
      return { ok: false, error: "订单不存在" };
    }
    if (order.status !== "pending") {
      return { ok: false, error: "仅待支付订单可移除未付菜品" };
    }

    const { data: item, error: itemErr } = await supabase
      .from("order_items")
      .select("id, order_id, line_amount, paid")
      .eq("id", itemId)
      .eq("order_id", orderId)
      .maybeSingle();

    if (itemErr) {
      console.error("removeUnpaidOrderItem item", itemErr);
      return { ok: false, error: "加载明细失败" };
    }
    if (!item) return { ok: false, error: "明细不存在" };
    if (item.paid) return { ok: false, error: "已支付菜品不可移除" };

    const { error: delErr } = await supabase
      .from("order_items")
      .delete()
      .eq("id", itemId);
    if (delErr) {
      console.error("removeUnpaidOrderItem delete", delErr);
      return { ok: false, error: "移除失败，请重试" };
    }

    const { data: remain, error: remainErr } = await supabase
      .from("order_items")
      .select("id, paid, line_amount")
      .eq("order_id", orderId);

    if (remainErr) {
      console.error("removeUnpaidOrderItem remain", remainErr);
      return { ok: false, error: "更新订单失败" };
    }

    const rows = remain ?? [];
    if (rows.length === 0) {
      const { error: delOrderErr } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (delOrderErr) {
        console.error("removeUnpaidOrderItem del order", delOrderErr);
        return { ok: false, error: "更新订单失败" };
      }
      revalidatePath("/orders");
      return { ok: true, deletedOrder: true };
    }

    const nextTotal = rows.reduce((s, r) => s + Number(r.line_amount), 0);
    const unpaid = rows.filter((r) => !r.paid);
    const nextPayable = unpaid.reduce((s, r) => s + Number(r.line_amount), 0);
    const hasPaid = rows.some((r) => r.paid);
    const nextStatus =
      nextPayable > 0 ? "pending" : hasPaid ? "confirmed" : "pending";

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        total_amount: nextTotal,
        payable_amount: nextStatus === "pending" ? nextPayable : 0,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("removeUnpaidOrderItem update", updateErr);
      return { ok: false, error: "更新订单失败" };
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "移除失败";
    return { ok: false, error: message };
  }
}

export async function fetchMyOrders(input?: {
  offset?: number;
  limit?: number;
  /** 按菜品名模糊搜索（含历史快照名） */
  keyword?: string;
  status?: OrderStatus | "all";
}): Promise<{ orders: OrderSummary[]; hasMore: boolean }> {
  const user = await requireUser();
  const offset = input?.offset ?? 0;
  const limit = Math.min(input?.limit ?? ORDER_PAGE_SIZE, 50);
  const keyword = input?.keyword?.trim() ?? "";
  const status =
    input?.status && input.status !== "all" ? input.status : undefined;
  const supabase = createServiceClient();

  let orderIds: string[] | null = null;

  if (keyword) {
    const { data: matchedItems, error: matchErr } = await supabase
      .from("order_items")
      .select("order_id, orders!inner(user_id)")
      .eq("orders.user_id", user.id)
      .ilike("dish_name", `%${keyword}%`);

    if (matchErr) {
      console.error("fetchMyOrders match", matchErr);
      throw new Error("搜索订单失败");
    }

    const idSet = new Set<string>();
    for (const row of matchedItems ?? []) {
      if (typeof row.order_id === "string") idSet.add(row.order_id);
    }

    // 订单号片段（列表展示前 8 位）；过短关键字易误伤 UUID
    if (keyword.length >= 4) {
      const { data: idRows, error: idErr } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id);

      if (idErr) {
        console.error("fetchMyOrders id scan", idErr);
        throw new Error("搜索订单失败");
      }

      const qLower = keyword.toLowerCase();
      for (const row of idRows ?? []) {
        const id = row.id as string;
        if (id.toLowerCase().includes(qLower)) idSet.add(id);
      }
    }

    orderIds = [...idSet];
    if (orderIds.length === 0) {
      return { orders: [], hasMore: false };
    }
  }

  let query = supabase
    .from("orders")
    .select(
      "id, total_amount, payable_amount, status, created_at, order_items(dish_name, quantity)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (orderIds) {
    query = query.in("id", orderIds);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.range(offset, offset + limit);

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
      payableAmount: Number(row.payable_amount ?? 0),
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
      "id, total_amount, payable_amount, status, remark, created_at, user_id, order_items(id, dish_id, dish_name, dish_image_url, unit_price, quantity, line_amount, paid)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("fetchOrderDetail", error);
    throw new Error("加载订单失败");
  }
  if (!data) return null;
  if (data.user_id !== user.id) {
    throw new Error("无权查看该订单");
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
      paid: boolean | null;
    }[]
  ).map((i) => ({
    id: i.id,
    dishId: i.dish_id,
    dishName: i.dish_name,
    dishImageUrl: i.dish_image_url,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
    lineAmount: Number(i.line_amount),
    paid: Boolean(i.paid),
  }));

  const hasPaidItem = items.some((i) => i.paid);
  const canCancel = data.status === "pending" && !hasPaidItem;

  return {
    id: data.id as string,
    totalAmount: Number(data.total_amount),
    payableAmount: Number(data.payable_amount ?? 0),
    status: data.status as OrderDetail["status"],
    remark: (data.remark as string | null) ?? null,
    createdAt: data.created_at as string,
    items,
    canCancel,
  };
}
