"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ICON_SIZE } from "@/lib/constants/icon-size";

type PreviewState = {
  urls: string[];
  index: number;
} | null;

/**
 * 全屏图片预览：object-contain、多图左右切换。
 * 通过 openPreview / ImagePreviewHost 使用。
 */
export function useImagePreview() {
  const [preview, setPreview] = useState<PreviewState>(null);

  const openPreview = useCallback((urls: string[], index = 0) => {
    const list = urls.filter(Boolean);
    if (list.length === 0) return;
    setPreview({
      urls: list,
      index: Math.min(Math.max(0, index), list.length - 1),
    });
  }, []);

  const closePreview = useCallback(() => setPreview(null), []);

  return { preview, openPreview, closePreview };
}

export function ImagePreviewHost({
  preview,
  onClose,
}: {
  preview: PreviewState;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (preview) setIndex(preview.index);
  }, [preview]);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setIndex((i) => (i > 0 ? i - 1 : preview.urls.length - 1));
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => (i < preview.urls.length - 1 ? i + 1 : 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, onClose]);

  if (!preview) return null;

  const { urls } = preview;
  const current = urls[index] ?? urls[0];
  const multi = urls.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/92"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <span className="text-sm text-white/80">
          {multi ? `${index + 1} / ${urls.length}` : "预览"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="关闭"
        >
          <X size={ICON_SIZE.close} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {multi ? (
          <button
            type="button"
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="上一张"
            onClick={() =>
              setIndex((i) => (i > 0 ? i - 1 : urls.length - 1))
            }
          >
            <ChevronLeft size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt=""
          className="max-h-full max-w-full object-contain"
        />

        {multi ? (
          <button
            type="button"
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="下一张"
            onClick={() =>
              setIndex((i) => (i < urls.length - 1 ? i + 1 : 0))
            }
          >
            <ChevronRight size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {multi ? (
        <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 张`}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
