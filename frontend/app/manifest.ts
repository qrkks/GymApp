import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lift Log 训练记录",
    short_name: "Lift Log",
    description: "记录训练部位、动作、重量、次数和训练笔记。",
    start_url: "/workouts",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7f9",
    theme_color: "#0c6e50",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
