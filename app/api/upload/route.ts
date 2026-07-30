import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import {
  UPLOAD_MAX_BYTES,
  UPLOAD_MIME_TYPES,
} from "@/lib/constants/branding";

export async function POST(request: NextRequest) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json(
        { code: 401, message: "请先登录" },
        { status: 401 },
      );
    }

    const apiKey = process.env.IMG_BB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { code: 500, message: "未配置 IMG_BB_API_KEY" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { code: 400, message: "没有找到文件" },
        { status: 400 },
      );
    }

    if (
      !UPLOAD_MIME_TYPES.includes(
        file.type as (typeof UPLOAD_MIME_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { code: 400, message: "仅支持 jpeg/png/webp/gif" },
        { status: 400 },
      );
    }

    if (file.size > UPLOAD_MAX_BYTES) {
      return NextResponse.json(
        { code: 400, message: "图片不能超过 3.5MB，请压缩后再传" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const imgbbForm = new FormData();
    imgbbForm.append("key", apiKey);
    imgbbForm.append("image", base64Image);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    });

    if (!response.ok) {
      console.error("imgbb status", response.status, await response.text());
      return NextResponse.json(
        { code: 500, message: "上传图片失败" },
        { status: 500 },
      );
    }

    const result = (await response.json()) as {
      data?: {
        url?: string;
        display_url?: string;
        title?: string;
        size?: number;
      };
    };

    const url = result.data?.display_url || result.data?.url;
    if (!url) {
      return NextResponse.json(
        { code: 500, message: "上传图片失败" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      code: 0,
      data: {
        url,
        displayUrl: url,
        filename: result.data?.title ?? file.name,
        size: result.data?.size ?? file.size,
      },
    });
  } catch (error) {
    console.error("upload failed", error);
    return NextResponse.json(
      { code: 500, message: "上传图片失败" },
      { status: 500 },
    );
  }
}
