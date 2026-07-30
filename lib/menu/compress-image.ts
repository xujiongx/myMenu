import imageCompression from "browser-image-compression";
import {
  UPLOAD_COMPRESS_MAX_EDGE,
  UPLOAD_COMPRESS_MAX_MB,
  UPLOAD_MAX_BYTES,
} from "@/lib/constants/branding";

/**
 * 上传前压缩：限制边长与体积，避免 Vercel Function ~4.5MB 请求体限制。
 * GIF 保持原样（压缩会丢动画）；过大则拒绝。
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }

  if (file.type === "image/gif") {
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new Error("GIF 过大，请压缩后再传或改用 jpg/png");
    }
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: UPLOAD_COMPRESS_MAX_MB,
    maxWidthOrHeight: UPLOAD_COMPRESS_MAX_EDGE,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: file.type === "image/png" ? "image/jpeg" : undefined,
  });

  if (compressed.size > UPLOAD_MAX_BYTES) {
    throw new Error("压缩后仍过大，请换一张更小的图片");
  }

  return compressed;
}
