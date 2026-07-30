import { AppLogo } from "@/components/common/AppLogo";
import { APP_DISPLAY_NAME } from "@/lib/constants/branding";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <AppLogo size={72} />
      <h1 className="font-display text-2xl text-foreground">{APP_DISPLAY_NAME}</h1>
      <p className="max-w-xs text-sm text-muted">
        当前网络不可用。请检查连接后重试；已打开过的页面可从主屏幕更快进入。
      </p>
    </div>
  );
}
