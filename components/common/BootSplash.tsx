import { AppLogo } from "@/components/common/AppLogo";
import { APP_DISPLAY_NAME } from "@/lib/constants/branding";

/** 首屏 / 路由切换时的品牌加载壳，避免长时间白屏 */
export function BootSplash({
  fullScreen = true,
  label = "加载中…",
}: {
  fullScreen?: boolean;
  label?: string;
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4 bg-[#f7f4ef]",
        fullScreen
          ? "fixed inset-0 z-[60]"
          : "min-h-dvh w-full",
      ].join(" ")}
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, #ffe9a8 0%, transparent 55%), radial-gradient(900px 500px at 100% 0%, #ffd7bf 0%, transparent 50%), #f7f4ef",
      }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="animate-pulse overflow-hidden rounded-[22%] shadow-[0_12px_40px_rgba(240,180,41,0.28)]">
        <AppLogo size={72} alt="" className="rounded-[22%]" />
      </div>
      <p className="font-display text-xl tracking-wide text-[#3b2a00]">
        {APP_DISPLAY_NAME}
      </p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
