export const APP_DISPLAY_NAME = "我的菜单";
export const APP_SHORT_NAME = "点菜";
export const APP_DESCRIPTION = "轻量移动端点菜：分类浏览、加购结算、订单记录与菜品管理";

export const SESSION_COOKIE = "menu_session";
export const CART_STORAGE_KEY = "menu_cart";
export const USER_STORAGE_KEY = "menu_user";

export const ACCOUNT_EMAIL_DOMAIN = "menu.local";

/** 上传限制 */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MENU_CACHE_TAG = "menu";
export const MENU_CACHE_REVALIDATE = 300;

export const ORDER_PAGE_SIZE = 20;
