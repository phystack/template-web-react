# template-web-react

Starter template for PhyStack **WEB** apps — Vite + React front-end bundles
delivered to a visitor's phone browser through a web endpoint, connected to
the platform through `@phystack/hub-client`. Scaffolded by the PhyStack CLI
(`phy app init --type web`) or usable directly.

Unlike a screen app there is no device and no secret on the client: the app
establishes a scoped PhyHub session from a one-time claim code delivered in
the URL fragment (`#code=…`, usually via a QR code), and receives its
resolved settings over that authenticated session from the endpoint's Web
twin.

## Getting started

```bash
# Scaffold via the PhyStack CLI
phy app init my-web-app --type web

# Or work directly from this template
bun install
bun run build
```

Requires `@phystack/hub-client` >= 6.9.0 (the release that ships the
web-app session branch).

## How a deployed web app boots

1. Publishing a build deploys the bundle under `{urlId}/` on the web
   endpoints CDN, next to a static `boot.json`
   (`{ urlId, region, phyhubUrl, coreApiUrl }` — routing info only, no
   settings, no secrets).
2. A visitor opens the endpoint URL with a claim code in the fragment
   (`#code=…`).
3. The app fetches `boot.json`, exchanges the code for a session
   (`POST …/api/v1/web-endpoints/{urlId}/session`), and connects to PhyHub.
   Token refresh, reconnects, and rotation are handled by
   `@phystack/hub-client`.
4. Settings resolve like they do for devices: endpoint-level override →
   space-level override → installation settings. They arrive on the Web twin
   with the `webAppAuthenticated` ack.

## Local development

```bash
bun install
bun run dev
```

There is no deployed `boot.json` in dev, so supply the boot fields via env
(e.g. in `.env.local`):

```
VITE_WEB_URL_ID=my-endpoint
VITE_WEB_REGION=eu
VITE_PHYHUB_URL=https://…
VITE_CORE_API_URL=https://…
```

Then open `http://localhost:3000/#code=<claim-code>` with a freshly minted
claim code. Codes are one-time: after a page reload, mint a new one.

Simulator support (`phy-simulator`) is not wired up yet for web sessions.

## Flow

```bash
# 1. Edit src/schema.ts (installation settings), src/analytics-schema.ts (events), src/App.tsx (UI)
# 2. Local build: typecheck + vite build + schemas into build/
bun run build

# 3. Register the app in your tenant (once)
phy app create my-web-app --type web

# 4. Submit + publish the build (no container image for web apps)
bun run pub
```

`pub` runs `phy app build create $npm_package_name --dir . --publish` — the
vite bundle and generated schemas are packaged and published as soon as the
build processes. Publishing redeploys the bundle to every enabled web
endpoint of each installation on the published build.

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Schemas + vite dev server (boot fields from env, code from `#code=…`) |
| `bun run build` | `tsc -b` + `vite build` + schemas + bundle post-processing |
| `bun run schema` | Generate `build/schema.json`, `meta-schema.json`, `analytics-schema.json` |
| `bun run pub` | Build, then submit + publish via the `phy` CLI |
| `bun run lint` | eslint |
| `bun run format` | prettier (`format:check` to verify only) |

## Layout

| Path | Purpose |
|------|---------|
| `src/App.tsx` | UI + web session connection (claim code → settings) |
| `src/boot.ts` | `boot.json` fetch with env fallback for local dev |
| `src/schema.ts` | Installation-settings schema (TypeScript → JSON Schema) |
| `src/analytics-schema.ts` | Analytics events this app emits |
| `scripts/` | Schema build, post-build bundle fixup |
| `vite.config.ts` | Dev server (port 3000), relative-path bundle output |

## Screen sibling

[template-screen-react](https://github.com/phystack/template-screen-react)
is the SCREEN-app variant of this template: same schema pipeline, build
output layout, and publish flow; only the connection branch differs (device
twin via `#instanceId` instead of a web session via `#code`). If you change
shared parts of one template, change both.
