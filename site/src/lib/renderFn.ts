import { createDirectives } from "marked-directive"
import hljs from "highlight.js"
import { Marked, type MarkedExtension } from "marked"
import markedAlert from "marked-alert"
import { markedHighlight } from "marked-highlight"
import type { RenderFn } from "vite-plugin-static-md/dist/options"

export type ExtBuilder = () => MarkedExtension

function makeRenderer(extensions?: ExtBuilder[]): RenderFn {
  const marked = new Marked()
  // renderer.use(createDirectives())
  if (extensions) {
    marked.use(...extensions.map((e) => e()))
  }

  // vite can't tell if Marked.parse is async version or not & errors when
  // calling Marked.parse(...).then(...); wrapping call to parse in this fn
  // solves that weird error
  async function renderMd(src: string): Promise<string> {
    return await marked.parse(src)
  }

  return async (src) => {
    return {
      // main page content
      "main-content": await renderMd(src),
    }
  }
}

function codeHighlighter() {
  return markedHighlight({
    emptyLangClass: "",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      // include option for skipping highlighting
      if (info.includes("no-hljs")) return code

      const language = hljs.getLanguage(lang) ? lang : "plaintext"
      const hlghtd = hljs.highlight(code, { language }).value
      return hlghtd
    },
  })
}

/// enable github style alerts
///
/// extends github's alerts to include TODO & ASIDE
function gfmAlerter(): MarkedExtension {
  // create alerter
  const ext = markedAlert({
    variants: [
      {
        type: "todo",
        // icon from font-awesome
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="octicon octicon-info mr-2"  viewBox="0 0 640 640" width="20" height="20" aria-hidden="true"><!--! Font Awesome Free 7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96L480 96zM160 144C151.2 144 144 151.2 144 160L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 160C496 151.2 488.8 144 480 144L160 144zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>',
        title: "TODO",
      },
      {
        type: "aside",
        // icon from font-awesome
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="octicon octicon-info mr-2"  viewBox="0 0 640 640" width="20" height="20" aria-hidden="true"><!--! Font Awesome Free 7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M108.2 322.7C114.3 307.5 112.2 290.1 102.6 276.8C88.1 256.7 80 233.1 80 208C80 141.2 140.5 80 224 80C307.5 80 368 141.2 368 208C368 274.8 307.5 336 224 336C208.1 336 192.9 333.7 178.7 329.5C168.4 326.4 157.3 327 147.3 331L96.9 351.2L108.3 322.7zM32 208C32 243.8 43.6 277.1 63.7 304.8L33.9 379.2C32.6 382.4 32 385.8 32 389.2C32 404 44 416 58.8 416C62.2 416 65.6 415.3 68.8 414.1L165.1 375.6C183.7 381.1 203.5 384 224 384C330 384 416 305.2 416 208C416 110.8 330 32 224 32C118 32 32 110.8 32 208zM416 576C436.6 576 456.3 573 474.9 567.6L571.2 606.1C574.4 607.4 577.8 608 581.2 608C596 608 608 596 608 581.2C608 577.8 607.3 574.4 606.1 571.2L576.4 496.8C596.4 469 608.1 435.7 608.1 400C608.1 317.6 546.4 248.5 463.1 229.3C461.5 245.6 458 261.2 453 276.2C516.9 291 560.2 343.5 560.2 400.1C560.2 425.2 552.1 448.8 537.6 468.9C528 482.2 525.9 499.5 532 514.8L543.4 543.3L493 523.1C483 519.1 471.9 518.6 461.6 521.6C447.4 525.8 432.2 528.1 416.3 528.1C344.1 528.1 289.2 482.4 275.6 426.9C260 430.1 243.9 431.9 227.5 432.1C243.9 514 322.2 576.1 416.3 576.1z"/></svg>',
        title: "Aside",
      },
    ],
  })

  // TIP, ASIDE, & NOTE reside in the sidebar, but TODO, important, warning, &
  // caution stay in the document flow to interrupt & get attention more easily
  const sidebarVariants = ["tip", "aside", "note"]

  // over-ride default renderer from marked-alert to wrap alerts in semantic `aside` tags instead of meaninless `div`
  return {
    ...ext,
    extensions: [
      {
        name: "alert",
        level: "block",
        renderer({ meta, tokens = [] }) {
          let className = `${meta.className}-container ${meta.className}-${meta.variant}`
          // float sidebar variants w/ css class
          if (sidebarVariants.includes(meta.variant))
            className += " right-aside"

          let tmpl = `<aside class="${className}">\n`
          tmpl += `<div class="${meta.className}-content">`
          tmpl += `<p class="${meta.titleClassName}">`
          tmpl += meta.icon
          tmpl += meta.title
          tmpl += "</p>\n"
          tmpl += this.parser.parse(tokens)
          tmpl += "</div>"
          tmpl += "</aside>\n"

          return tmpl
        },
      },
    ],
  }
}

export default makeRenderer([codeHighlighter, gfmAlerter, createDirectives])
