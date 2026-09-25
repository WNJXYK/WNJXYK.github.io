# Project subpath hosting

The following project pages currently live outside this repository and must remain reachable when `zhouz.dev` is moved to Cloudflare Pages:

- `/DeCoOp/` — source repository: [WNJXYK/DeCoOp](https://github.com/WNJXYK/DeCoOp), GitHub Pages content is under `docs/`.
- `/FTTA/` — source repository: [WNJXYK/FTTA](https://github.com/WNJXYK/FTTA), GitHub Pages content is under `docs/`.
- `/RPC/` — source repository: [WNJXYK/RPC](https://github.com/WNJXYK/RPC), project page is generated from the repository root.
- `/TTA-Learnability/` — source repository: [WNJXYK/TTA-Learnability](https://github.com/WNJXYK/TTA-Learnability), project page hosting source must be confirmed before DNS cutover.

These pages are currently bundled in `public/` from their public GitHub repositories so the Astro build keeps the paths available on Cloudflare Pages. Refresh the copies when the upstream pages change, then test both each path and its trailing-slash/static assets before deployment. If you prefer independent hosting instead of bundling, configure a Cloudflare Worker/Pages Function, reverse-proxy route, or a verified redirect to each project's still-working origin; do not add redirects that point back to `zhouz.dev` and create a loop.
