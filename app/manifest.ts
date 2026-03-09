import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verdant",
    short_name: "Verdant",
    description: "Stake STRK, verify outdoor grass photos, and earn streak rewards.",
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
