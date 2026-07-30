/**
 * Web App /「添加到主屏幕」展示名称与说明。
 *
 * - 名称：改下面三个常量即可；`app/layout.tsx` 与 `app/manifest.ts` 已引用。
 * - 图标：维护 **`app/logo.ico`**（并同步 `app/icon.ico`、`public/logo.ico`）；
 *   favicon / iOS 主屏幕 / manifest / AppLogo 均使用 `/logo.ico`。换图后若主屏幕仍旧，请删图标重新添加。
 */
export const APP_DISPLAY_NAME = "小菜单";

/** 主屏幕图标下短名（宜 2～4 字） */
export const APP_SHORT_NAME = "小菜单";

export const APP_DESCRIPTION = "轻量移动端点菜：分类浏览、加购结算、订单记录与菜品管理";

export const SESSION_COOKIE = "menu_session";
export const CART_STORAGE_KEY = "menu_cart";
export const USER_STORAGE_KEY = "menu_user";

export const ACCOUNT_EMAIL_DOMAIN = "menu.local";

/** 应用图标公网路径（与 public/logo.ico、app/logo.ico 同源） */
export const APP_ICON_PATH = "/logo.ico";

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
