import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Findesk — Финансовый учёт",
    short_name:       "Findesk",
    description:      "Управленческий финансовый учёт для бизнеса Казахстана",
    start_url:        "/",
    display:          "standalone",
    background_color: "#ffffff",
    theme_color:      "#1A56DB",
    orientation:      "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Добавить транзакцию",
        url:  "/transactions?action=new",
        icons: [{ src: "/icons/icon-192.png", sizes: "96x96" }],
      },
      {
        name: "Дашборд",
        url:  "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "96x96" }],
      },
    ],
  };
}
