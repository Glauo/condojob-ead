import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CondoJob Educacional",
    short_name: "CondoJob",
    description: "Plataforma CondoJob Educacional",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#070B14",
    theme_color: "#818CF8",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
