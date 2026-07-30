import type { ReactNode } from "react";
import { BackLink } from "@/components/common/BackLink";

/** 二级页顶栏：返回左、标题居中、可选右侧操作 */
export function PageHeader({
  backHref,
  title,
  right,
  className,
  children,
}: {
  backHref: string;
  title: string;
  right?: ReactNode;
  className?: string;
  /** 标题行下方内容（如筛选条） */
  children?: ReactNode;
}) {
  return (
    <header
      className={[
        "sticky top-0 z-10 border-b border-line bg-[#fffaf2]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative flex min-h-8 items-center justify-center">
        <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
          <BackLink href={backHref} />
        </div>
        <h1 className="max-w-[60%] truncate text-center font-display text-xl">
          {title}
        </h1>
        {right ? (
          <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
            {right}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  );
}
