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
  imageUrl: string | null;
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
};

export type OrderSummary = {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  itemsPreview: { dishName: string; quantity: number }[];
};

export type OrderDetail = {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  remark: string | null;
  createdAt: string;
  items: OrderItemRow[];
};
