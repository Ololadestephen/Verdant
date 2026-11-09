import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verdant | Touch Grass on BOT Chain",
    short_name: "Verdant",
    description: "Daily outdoor photo check-ins and milestone badges on BOT Chain.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5faef",
    theme_color: "#2f8143",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
