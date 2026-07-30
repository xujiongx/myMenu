export type UserRole = "user" | "admin";
export type DishStatus = "on" | "off";
export type OrderStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Profile = {
  id: string;
  account: string;
  nickname: string;
  avatarUrl: string | null;
  role: UserRole;
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Dish = {
  id: string;
  categoryId: string;
  name: string;
  /** 封面 = imageUrls[0] */
  imageUrl: string | null;
  imageUrls: string[];
  price: number;
  description: string | null;
  status: DishStatus;
};

export type MenuSnapshot = {
  categories: Category[];
  dishes: Dish[];
};

export type CartItem = {
  dishId: string;
  quantity: number;
};

export type OrderItemRow = {
  id: string;
  dishId: string | null;
  dishName: string;
  dishImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  /** 是否已支付；未支付可移除 */
  paid: boolean;
};

export type OrderSummary = {
  id: string;
  totalAmount: number;
  /** 当前待支付金额（待支付状态） */
  payableAmount: number;
  status: OrderStatus;
  createdAt: string;
  itemsPreview: { dishName: string; quantity: number }[];
};

export type OrderDetail = {
  id: string;
  totalAmount: number;
  payableAmount: number;
  status: OrderStatus;
  remark: string | null;
  createdAt: string;
  items: OrderItemRow[];
  /** 整单可取消：待支付且无任何已付明细 */
  canCancel: boolean;
};

/** 菜品下单排行（非取消订单明细聚合） */
export type DishOrderRank = {
  dishId: string | null;
  dishName: string;
  dishImageUrl: string | null;
  totalQuantity: number;
  totalAmount: number;
};

export type OrderStats = {
  orderCount: number;
  totalServings: number;
  totalSpend: number;
  statusCounts: {
    pending: number;
    confirmed: number;
    completed: number;
  };
  ranking: DishOrderRank[];
};
