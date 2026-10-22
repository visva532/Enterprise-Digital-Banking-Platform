import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { site } from "./src/config.js";

// Writes canonical and social tags into index.html once a domain is configured.
function siteMeta() {
  return {
    name: "site-meta",
    transformIndexHtml(html) {
      if (!site.domain) return html.replace("<!--site-meta-->", "");
      const url = `https://${site.domain}/`;
      const tags = [
        `<link rel="canonical" href="${url}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${site.name}" />`,
        `<meta property="og:title" content="${site.name}" />`,
        `<meta property="og:url" content="${url}" />`,
      ].join("\n    ");
      return html.replace("<!--site-meta-->", tags);
    },
  };
}

export default defineConfig({
  plugins: [react(), siteMeta()],
  build: {
    sourcemap: false,
    assetsInlineLimit: 0,
  },
});
