import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ICON_SIZE } from "@/lib/constants/icon-size";

export function BackLink({
  href,
  label = "返回",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-sm text-muted"
    >
      <ChevronLeft size={ICON_SIZE.md} strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}
