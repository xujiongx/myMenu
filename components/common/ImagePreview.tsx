"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ICON_SIZE } from "@/lib/constants/icon-size";

type PreviewState = {
  urls: string[];
  index: number;
} | null;

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.4;

/**
 * 全屏图片预览：多图切换、缩放、旋转；点遮罩关闭。
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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (preview) {
      setIndex(preview.index);
      resetTransform();
    }
  }, [preview, resetTransform]);

  useEffect(() => {
    resetTransform();
  }, [index, resetTransform]);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Number((s + delta).toFixed(2))),
      );
      if (next <= MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    if (!preview || preview.urls.length < 2) return;
    setIndex((i) => (i > 0 ? i - 1 : preview.urls.length - 1));
  }, [preview]);

  const goNext = useCallback(() => {
    if (!preview || preview.urls.length < 2) return;
    setIndex((i) => (i < preview.urls.length - 1 ? i + 1 : 0));
  }, [preview]);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "+" || e.key === "=") zoomBy(SCALE_STEP);
      if (e.key === "-" || e.key === "_") zoomBy(-SCALE_STEP);
      if (e.key === "r" || e.key === "R") setRotation((r) => r + 90);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, onClose, goPrev, goNext, zoomBy]);

  if (!preview) return null;

  const { urls } = preview;
  const current = urls[index] ?? urls[0];
  const multi = urls.length > 1;

  function touchDistance(a: React.Touch, b: React.Touch) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      dragging.current = false;
      pinchStart.current = {
        dist: touchDistance(e.touches[0], e.touches[1]),
        scale,
      };
      return;
    }
    if (e.touches.length === 1 && scale > 1) {
      dragging.current = true;
      lastPoint.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const next =
        pinchStart.current.scale * (dist / pinchStart.current.dist);
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
      return;
    }
    if (
      e.touches.length === 1 &&
      dragging.current &&
      lastPoint.current &&
      scale > 1
    ) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - lastPoint.current.x;
      const dy = y - lastPoint.current.y;
      lastPoint.current = { x, y };
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
    }
  }

  function onTouchEnd() {
    dragging.current = false;
    lastPoint.current = null;
    pinchStart.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    e.stopPropagation();
    zoomBy(e.deltaY > 0 ? -SCALE_STEP / 2 : SCALE_STEP / 2);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    if (scale <= 1) return;
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    if (!dragging.current || !lastPoint.current || scale <= 1) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }

  function onPointerUp() {
    dragging.current = false;
    lastPoint.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/92"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/80">
          {multi ? `${index + 1} / ${urls.length}` : "预览"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="tap-icon flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="关闭"
        >
          <X size={ICON_SIZE.close} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-2"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {multi ? (
          <button
            type="button"
            className="tap-icon absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="上一张"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <ChevronLeft size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt=""
          draggable={false}
          className="max-h-full max-w-full select-none object-contain will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: dragging.current ? "none" : "transform 0.15s ease-out",
            cursor: scale > 1 ? "grab" : "default",
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (scale > 1) resetTransform();
            else setScale(2);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        {multi ? (
          <button
            type="button"
            className="tap-icon absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="下一张"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <ChevronRight size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <div
        className="flex flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        {multi ? (
          <div className="flex justify-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`第 ${i + 1} 张`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-full bg-white/15 px-2 py-1.5 backdrop-blur-sm">
          <button
            type="button"
            className="tap-icon flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-35"
            aria-label="缩小"
            disabled={scale <= MIN_SCALE}
            onClick={() => zoomBy(-SCALE_STEP)}
          >
            <ZoomOut size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="tap-icon flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-35"
            aria-label="放大"
            disabled={scale >= MAX_SCALE}
            onClick={() => zoomBy(SCALE_STEP)}
          >
            <ZoomIn size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="tap-icon flex h-9 w-9 items-center justify-center rounded-full text-white"
            aria-label="向左旋转"
            onClick={() => setRotation((r) => r - 90)}
          >
            <RotateCcw size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="tap-icon flex h-9 w-9 items-center justify-center rounded-full text-white"
            aria-label="向右旋转"
            onClick={() => setRotation((r) => r + 90)}
          >
            <RotateCw size={ICON_SIZE.lg} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full px-2.5 py-1 text-xs text-white/90 disabled:opacity-35"
            aria-label="重置"
            disabled={scale === 1 && rotation % 360 === 0 && offset.x === 0 && offset.y === 0}
            onClick={resetTransform}
          >
            复位
          </button>
        </div>
      </div>
    </div>
  );
}
