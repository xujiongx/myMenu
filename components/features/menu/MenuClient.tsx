"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { addOrderItems, createOrder } from "@/app/actions/order";
import { refreshMenuCache } from "@/app/actions/menu";
import { fetchDishOrderCounts } from "@/app/actions/stats";
import { BackLink } from "@/components/common/BackLink";
import {
  ImagePreviewHost,
  useImagePreview,
} from "@/components/common/ImagePreview";
import { DishDetailModal } from "@/components/features/menu/DishDetailModal";
import { CART_STORAGE_KEY } from "@/lib/constants/branding";
import { ICON_SIZE } from "@/lib/constants/icon-size";
import type { Category, Dish } from "@/lib/types";
import { ImageIcon, Minus, Plus, RefreshCw, Search, ShoppingCart } from "lucide-react";

type Props = {
  categories: Category[];
  dishes: Dish[];
  /** 加菜目标订单；有值时结算改为加菜 */
  orderId?: string | null;
};

/** 有底栏时抬高购物车；加菜二级页无底栏贴底留白 */
const CART_BOTTOM_TAB =
  "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]";
const CART_BOTTOM_PLAIN =
  "bottom-[max(1rem,env(safe-area-inset-bottom))]";

function loadCart(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveCart(cart: Record<string, number>) {
  sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function MenuClient({ categories, dishes, orderId }: Props) {
  const router = useRouter();
  const isAddMode = Boolean(orderId);
  const listRef = useRef<HTMLElement | null>(null);
  const categoryBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollingByClick = useRef(false);
  const scrollUnlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const [cart, setCart] = useState<Record<string, number>>(() =>
    orderId ? {} : loadCart(),
  );
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const { preview, openPreview, closePreview } = useImagePreview();

  useEffect(() => {
    let cancelled = false;
    void fetchDishOrderCounts()
      .then((counts) => {
        if (!cancelled) setOrderCounts(counts);
      })
      .catch(() => {
        /* 已点次数非关键路径，失败静默 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dishMap = useMemo(
    () => new Map(dishes.map((d) => [d.id, d])),
    [dishes],
  );

  const q = keyword.trim().toLowerCase();
  const isSearching = q.length > 0;

  const visibleSections = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        dishes: dishes.filter((d) => {
          if (d.categoryId !== cat.id) return false;
          if (!isSearching) return true;
          return (
            d.name.toLowerCase().includes(q) ||
            (d.description ?? "").toLowerCase().includes(q)
          );
        }),
      }))
      .filter((s) => s.dishes.length > 0);
  }, [categories, dishes, isSearching, q]);

  const { totalQty, totalAmount } = useMemo(() => {
    let qty = 0;
    let amount = 0;
    for (const [id, n] of Object.entries(cart)) {
      if (n <= 0) continue;
      const dish = dishMap.get(id);
      if (!dish) continue;
      qty += n;
      amount += dish.price * n;
    }
    return { totalQty: qty, totalAmount: amount };
  }, [cart, dishMap]);

  const updateQty = useCallback((dishId: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const value = (next[dishId] ?? 0) + delta;
      if (value <= 0) delete next[dishId];
      else next[dishId] = value;
      saveCart(next);
      return next;
    });
  }, []);

  const scrollCategoryIntoView = useCallback((categoryId: string) => {
    categoryBtnRefs.current[categoryId]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, []);

  const onCategoryClick = useCallback(
    (categoryId: string) => {
      setActiveCategoryId(categoryId);
      scrollCategoryIntoView(categoryId);
      const wasSearching = isSearching;
      if (wasSearching) setKeyword("");

      scrollingByClick.current = true;
      if (scrollUnlockTimer.current) clearTimeout(scrollUnlockTimer.current);

      window.setTimeout(() => {
        document
          .getElementById(`cat-${categoryId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, wasSearching ? 60 : 0);

      scrollUnlockTimer.current = setTimeout(() => {
        scrollingByClick.current = false;
      }, wasSearching ? 520 : 450);
    },
    [isSearching, scrollCategoryIntoView],
  );

  const onListScroll = useCallback(() => {
    if (scrollingByClick.current || isSearching) return;
    const root = listRef.current;
    if (!root) return;

    const rootTop = root.getBoundingClientRect().top;
    let currentId = categories[0]?.id ?? "";
    for (const cat of categories) {
      const section = document.getElementById(`cat-${cat.id}`);
      if (!section) continue;
      const top = section.getBoundingClientRect().top - rootTop;
      if (top <= 48) currentId = cat.id;
    }
    setActiveCategoryId((prev) => {
      if (prev === currentId) return prev;
      scrollCategoryIntoView(currentId);
      return currentId;
    });
  }, [categories, isSearching, scrollCategoryIntoView]);

  useEffect(() => {
    return () => {
      if (scrollUnlockTimer.current) clearTimeout(scrollUnlockTimer.current);
    };
  }, []);

  function onCheckout() {
    if (totalQty === 0) {
      setMessage("请先选择菜品");
      return;
    }
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([dishId, quantity]) => ({ dishId, quantity }));

    startTransition(async () => {
      if (orderId) {
        const result = await addOrderItems(orderId, { items });
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setCart({});
        sessionStorage.removeItem(CART_STORAGE_KEY);
        setMessage(`加菜成功，待付 ¥${result.addedAmount.toFixed(2)}`);
        router.push(`/orders/${orderId}`);
        router.refresh();
        return;
      }

      const result = await createOrder({ items });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setCart({});
      sessionStorage.removeItem(CART_STORAGE_KEY);
      setMessage(`下单成功，合计 ¥${result.totalAmount.toFixed(2)}`);
      router.push(`/orders/${result.orderId}`);
      router.refresh();
    });
  }

  function onRefresh() {
    startTransition(async () => {
      await refreshMenuCache();
      router.refresh();
      setMessage("菜单已刷新");
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-line bg-[#fffaf2] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="relative mb-3 flex min-h-8 items-center justify-center">
          {isAddMode && orderId ? (
            <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
              <BackLink href={`/orders/${orderId}`} />
            </div>
          ) : null}
          <h1 className="font-display text-xl">
            {isAddMode ? "加菜" : "点菜"}
          </h1>
          <button
            type="button"
            onClick={onRefresh}
            className="absolute right-0 top-1/2 z-10 inline-flex -translate-y-1/2 items-center gap-1 text-sm text-brand-deep"
            disabled={pending}
          >
            <RefreshCw size={ICON_SIZE.sm} strokeWidth={2} aria-hidden />
            刷新
          </button>
        </div>
        <div className="relative">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索菜品名称"
            className="w-full rounded-2xl border border-line bg-card py-2.5 pr-3 pl-10 text-sm outline-none focus:border-brand"
          />
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <Search size={ICON_SIZE.md} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-[5.5rem] shrink-0 overflow-y-auto overscroll-contain border-r border-line bg-[#f3eee6]">
          {categories.map((cat) => {
            const active = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                ref={(node) => {
                  categoryBtnRefs.current[cat.id] = node;
                }}
                onClick={() => onCategoryClick(cat.id)}
                className={`relative block w-full px-2 py-3.5 text-center text-xs leading-tight transition ${
                  active
                    ? "bg-card font-semibold text-brand-deep"
                    : "text-muted"
                }`}
              >
                {active ? (
                  <span className="absolute top-2 bottom-2 left-0 w-1 rounded-r bg-brand" />
                ) : null}
                {cat.name}
              </button>
            );
          })}
        </aside>

        <section
          ref={listRef}
          onScroll={onListScroll}
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 py-3 pb-28"
        >
          {visibleSections.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-sm text-muted">
              <p>{isSearching ? "未找到相关菜品" : "该分类暂无菜品"}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {visibleSections.map(({ category, dishes: list }) => (
                <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-2">
                  <h2 className="mb-2 px-0.5 text-sm font-semibold text-muted">
                    {category.name}
                  </h2>
                  <ul className="space-y-3">
                    {list.map((dish) => {
                      const qty = cart[dish.id] ?? 0;
                      const ordered = orderCounts[dish.id] ?? 0;
                      return (
                        <li
                          key={dish.id}
                          className="flex gap-3 rounded-2xl border border-line bg-card p-3 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => setDetailDish(dish)}
                            className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f0e9df] text-left"
                            aria-label="查看菜品"
                          >
                            {dish.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-muted">
                                <ImageIcon size={ICON_SIZE.lg} strokeWidth={1.75} aria-hidden />
                              </div>
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => setDetailDish(dish)}
                              className="w-full text-left"
                            >
                              <h3 className="truncate font-semibold">
                                {dish.name}
                              </h3>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                                {dish.description || "暂无简介"}
                              </p>
                              {ordered > 0 ? (
                                <p className="mt-1 text-[11px] text-brand-deep">
                                  已点 {ordered} 次
                                </p>
                              ) : null}
                            </button>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="font-semibold text-accent">
                                ¥{dish.price.toFixed(2)}
                              </span>
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {qty > 0 ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updateQty(dish.id, -1)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted"
                                      aria-label="减少"
                                    >
                                      <Minus size={ICON_SIZE.sm} strokeWidth={2.25} aria-hidden />
                                    </button>
                                    <span className="w-5 text-center text-sm">
                                      {qty}
                                    </span>
                                  </>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => updateQty(dish.id, 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[#3b2a00]"
                                  aria-label="增加"
                                >
                                  <Plus size={ICON_SIZE.sm} strokeWidth={2.25} aria-hidden />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div
        className={`fixed ${isAddMode ? CART_BOTTOM_PLAIN : CART_BOTTOM_TAB} left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-3`}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-[#2b2118] px-3 py-2.5 text-white shadow-lg">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand text-[#3b2a00]">
            <ShoppingCart size={ICON_SIZE.cart} strokeWidth={2} aria-hidden />
            {totalQty > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {totalQty}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/70">已选 {totalQty} 份</p>
            <p className="text-lg font-semibold">¥{totalAmount.toFixed(2)}</p>
          </div>
          <button
            type="button"
            disabled={pending || totalQty === 0}
            onClick={onCheckout}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#3b2a00] disabled:opacity-40"
          >
            {pending
              ? "提交中…"
              : isAddMode
                ? "确认加菜"
                : "去结算"}
          </button>
        </div>
      </div>

      {detailDish ? (
        <DishDetailModal
          dish={detailDish}
          quantity={cart[detailDish.id] ?? 0}
          orderedCount={orderCounts[detailDish.id] ?? 0}
          onClose={() => setDetailDish(null)}
          onChangeQty={(delta) => updateQty(detailDish.id, delta)}
          onPreviewImage={(urls, index) => openPreview(urls, index)}
        />
      ) : null}

      <ImagePreviewHost preview={preview} onClose={closePreview} />

      {message ? (
        <button
          type="button"
          className="fixed inset-x-0 top-16 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-[#2b2118]/90 px-4 py-2 text-sm text-white"
          onClick={() => setMessage(null)}
        >
          {message}
        </button>
      ) : null}
    </div>
  );
}
