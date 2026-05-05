import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Norek",
    short_name: "Norek",
    description: "Challenges, Wallet und Community in einer App.",
    start_url: "/",
    display: "standalone",
    background_color: "#050d1a",
    theme_color: "#050d1a",
    lang: "de",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
