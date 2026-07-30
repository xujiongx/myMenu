import {
  APP_DISPLAY_NAME,
  APP_ICON_PATH,
} from "@/lib/constants/branding";

/**
 * 站标：与 `app/logo.ico` / `public/logo.ico` 同源（浏览器标签、favicon、iOS 主屏幕均使用该文件）。
 */
export function AppLogo({
  size = 56,
  className = "",
  alt = APP_DISPLAY_NAME,
}: {
  size?: number;
  className?: string;
  /** 装饰性场景可传空字符串 */
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={APP_ICON_PATH}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 select-none ${className}`}
    />
  );
}
