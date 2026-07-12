---
name: Chrome extension build tooling without pnpm workspace membership
description: How to add a minification/bundling build step for a Chrome extension folder that isn't a pnpm workspace package
---

The `chrome-extension/` directory in this project (e.g. `bird-newtab`) is not
listed in `pnpm-workspace.yaml`, so it has no `package.json`/`node_modules`
of its own and can't `import` npm packages like `esbuild` directly in a
Node script.

**Rule:** for one-off build scripts in such a folder, shell out to tool
CLIs via `npx --yes <tool> ...` (e.g. `esbuild ... --bundle --minify`,
`clean-css-cli -o out.css in.css`) instead of adding the package as a
dependency or `import`-ing it as a module. `npx --yes` downloads and runs
the CLI without needing it installed anywhere in the repo.

**Why:** Node's ESM resolver throws `ERR_MODULE_NOT_FOUND` when a script
outside any `node_modules`-having package tries to `import` a package that
isn't installed relative to it. Adding a whole extension folder to the
pnpm workspace just to get a build step is disproportionate for a small,
dependency-free browser extension.

**How to apply:** any time you need a build/minify/bundle step for code
that lives outside the pnpm workspace packages, prefer `execSync("npx
--yes <cli> ...")` over `import`-ing the tool's JS API.
