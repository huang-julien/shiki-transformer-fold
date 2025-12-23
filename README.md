# shiki-transformer-fold

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/shiki-transformer-fold?color=yellow)](https://npmjs.com/package/shiki-transformer-fold)
[![npm downloads](https://img.shields.io/npm/dm/shiki-transformer-fold?color=yellow)](https://npm.chart.dev/shiki-transformer-fold)

<!-- /automd -->

Code folding support for shiki.

## Usage

Install the package:

```sh
# ✨ Auto-detect (supports npm, yarn, pnpm, deno and bun)
npx nypm install shiki-transformer-fold
```

Add the transformer 

```ts
import { codeToHtml } from "shiki";
import { attachFoldToggleListener, transformerRenderHtmlFold } from "shiki-transformer-fold";

const html = await codeToHtml(code, {
  lang: "html",
  theme: "nord",
  transformers: [transformerRenderHtmlFold()],
});

// attach listeners to allow opening and closing the rendered code
// need to be called only once
attachFoldToggleListener();
```

## Development

<details>

<summary>local development</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

</details>

## License

<!-- automd:contributors license=MIT -->

Published under the [MIT](https://github.com/huang-julien/shiki-transformer-fold/blob/main/LICENSE) license.
Made by [community](https://github.com/huang-julien/shiki-transformer-fold/graphs/contributors) 💛
<br><br>
<a href="https://github.com/huang-julien/shiki-transformer-fold/graphs/contributors">
<img src="https://contrib.rocks/image?repo=huang-julien/shiki-transformer-fold" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
