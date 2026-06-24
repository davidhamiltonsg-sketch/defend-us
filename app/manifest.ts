import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "defend-us",
    short_name: "defend-us",
    description: "A private space to think clearly about your relationship — between the moments.",
    start_url: "/",
    display: "standalone",
    background_color: "#15120e",
    theme_color: "#15120e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
