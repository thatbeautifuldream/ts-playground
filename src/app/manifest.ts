import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TypeScript Playground",
    short_name: "TS Playground",
    description: "A TypeScript and JavaScript playground.",
    start_url: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
  };
}
