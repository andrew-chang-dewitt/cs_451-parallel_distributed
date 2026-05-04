import postcssEnvFunction from "postcss-env-function"
import { resolve } from "path"
import type { UserConfig } from "vite"
// import { DevTools } from "@vitejs/devtools"

import staticMd from "vite-plugin-static-md"
import renderFn from "./src/lib/renderFn"

const OUT_DIR = resolve(__dirname, "dist")
const HTML_ROOT = resolve(__dirname, "src/pages")
const SRC_ROOT = resolve(__dirname, "src")

const cssEnvVars = {
  environmentVariables: {
    "--layout-screen-small": "44rem",
    "--layout-screen-medium": "60rem",
  },
}

const ssg = staticMd({
  cssFile: resolve(SRC_ROOT, "styles/global.css"),
  renderFn,
})

export default {
  appType: "mpa",
  build: {
    outDir: OUT_DIR,
    rollupOptions: {
      input: {
        404: resolve(HTML_ROOT, "404.html"),
      },
    },
    // rolldownOptions: {
    //   devtools: {}, // enable devtools mode
    // },
  },
  css: {
    postcss: {
      map: true,
      plugins: [
        postcssEnvFunction({
          importFrom: [cssEnvVars],
        }),
      ],
    },
  },
  plugins: [
    ssg,
    // DevTools(),
  ],
  resolve: { alias: { $: SRC_ROOT } },
  root: HTML_ROOT,
} satisfies UserConfig
