"use client";

import { useState } from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ImageIcon } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";

type Props = {
  urls: string[];
  alt: string;
  onPreview?: (index: number) => void;
  className?: string;
};

/**
 * 菜品图轮播（Swiper）：宽度铺满、autoHeight 自适应，滑动带动效与分页点。
 */
export function DishImageCarousel({
  urls,
  alt,
  onPreview,
  className = "",
}: Props) {
  const [index, setIndex] = useState(0);

  if (urls.length === 0) {
    return (
      <div
        className={`flex h-40 w-full items-center justify-center bg-[#f0e9df] text-muted ${className}`}
      >
        <ImageIcon size={32} strokeWidth={1.75} aria-hidden />
      </div>
    );
  }

  return (
    <div className={`dish-image-carousel relative bg-[#f0e9df] ${className}`}>
      <Swiper
        modules={[Pagination]}
        pagination={urls.length > 1 ? { clickable: true } : false}
        autoHeight
        spaceBetween={0}
        resistanceRatio={0.85}
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        className="w-full"
      >
        {urls.map((url, i) => (
          <SwiperSlide key={`${url}-${i}`}>
            <button
              type="button"
              className="block w-full"
              onClick={() => onPreview?.(i)}
              aria-label={urls.length > 1 ? `预览第 ${i + 1} 张` : "预览图片"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={i === 0 ? alt : `${alt} ${i + 1}`}
                className="block h-auto max-h-[55vh] w-full object-contain"
                draggable={false}
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
      {urls.length > 1 ? (
        <span className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white">
          {index + 1}/{urls.length}
        </span>
      ) : null}
    </div>
  );
}
