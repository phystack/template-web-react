# CLAUDE.md — template-web-react

Starter template for PhyStack **WEB** apps: a Vite + React 18 + TypeScript
front-end bundle delivered to a visitor's phone browser through a web
endpoint, connected to the platform through `@phystack/hub-client` (a Web
twin session minted from a one-time claim code). Scaffolded by
`phy app init <name> --type web`.

## Commands (bun-only — no npm/yarn scripts)

| Command | What it runs |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Schemas + `vite` (boot from `public/boot.json`, claim code from `#code=…`) |
| `bun run build` | `tsc -b` + `vite build` + schemas + `scripts/post-build.js` |
| `bun run schema` | `scripts/build-schema.js` + `scripts/build-analytics-schema.js` → `build/` |
| `bun run pub` | `bun run build && phy app build create $npm_package_name --dir . --publish` |
| `bun run lint` / `format` / `format:check` | eslint / prettier |

## Dev loop

- No simulator support yet for web sessions. Create a git-ignored
  `public/boot.json` (`{ urlId, phyhubUrl, sessionBaseUrl }`) pointing at a
  real environment, then open `http://localhost:3000/#code=<claim-code>`.
- Claim codes are one-time. A page reload consumes nothing by itself, but a
  new session needs a freshly minted code — the refresh-grant rotation only
  survives inside a running page.
- The hub connection is a per-window singleton; `connectPhyClient()`
  is called once from `src/App.tsx` and signals reuse the same socket. Do
  not open a second connection.
- Settings come from the endpoint's Web twin desired properties, delivered
  on the `webAppAuthenticated` ack — resolution order is endpoint override →
  space override → installation settings. There is no public settings URL.

## Schema pipeline

`src/schema.ts` → `scripts/build-schema.js` → `build/schema.json`
(validation) + `build/meta-schema.json` (Console UI hints).
`src/analytics-schema.ts` → `build/analytics-schema.json`.
`scripts/post-build.js` finalizes the bundle layout after `vite build`.

## Publish flow (new `phy` CLI grammar)

```bash
phy login
phy app create <name> --type web   # register in your tenant (once)
bun run pub                        # build, submit + publish (no container image)
```

Web builds ship no container, so there is no `--push` and no registry
login. The legacy `@phystack/cli` (Node) does not work with this template —
use the Rust `phy` CLI only.

## Layout

| Path | Purpose |
|---|---|
| `src/App.tsx` | UI + zero-config `connectPhyClient()`, settings, session-terminated handling |
| `src/schema.ts` | Installation-settings schema source |
| `src/analytics-schema.ts` | Analytics events this app emits |
| `scripts/` | Schema build, post-build fixup |
| `vite.config.ts` | Dev server (port 3000), relative-path bundle output |

## Gotchas

- `application-type` in package.json must stay `web`; the package.json
  `name` is the app name used by `pub` (`$npm_package_name`).
- The bundle must keep relative asset paths (`base: "./"` in
  `vite.config.ts`) — it is served under a `{urlId}/` prefix on the CDN.
- `boot.json` is written by the platform at deploy time; never commit one
  into the bundle, and never put settings or secrets in it.
- Requires `@phystack/hub-client` >= 6.9.0 (web-app session branch).
- **Lockstep rule:** shared parts (schema pipeline, scripts/, build layout)
  are copies of `template-screen-react`. If you change something here,
  apply it there too.
