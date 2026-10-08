import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FleetGuard",
    short_name: "FleetGuard",
    description: "DOT compliance tracking with expiry reminders for small fleets.",
    start_url: "/app",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#101820",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
