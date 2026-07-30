import type { MetadataRoute } from "next";
import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APP_ICON_PATH,
  APP_SHORT_NAME,
} from "@/lib/constants/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_DISPLAY_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ef",
    theme_color: "#f0b429",
    orientation: "portrait",
    icons: [
      {
        src: APP_ICON_PATH,
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
