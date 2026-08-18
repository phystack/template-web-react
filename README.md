# PhyStack Web App Template (React)

Starter for a **web app** — a public, browser-delivered PhyStack app that runs on a
visitor's phone. Unlike a screen app there is no device and no secret on the client:
the app establishes a scoped PhyHub session from a one-time claim code delivered in
the URL fragment (`#code=…`, usually via a QR code), and receives its resolved
settings over that authenticated session from the endpoint's Web twin.

Based on the screen template (`template-screen-react`); the schema pipeline, build
output layout, and publish flow are identical — and so is the app code:
`connectPhyClient()` with no arguments, exactly like a screen app.

## How it works

1. The platform deploys the built bundle under `{urlId}/` on the web endpoints
   CDN, next to a static `boot.json` (`{ urlId, phyhubUrl, sessionBaseUrl }` —
   routing info only, no settings, no secrets).
2. A visitor opens the endpoint URL with a claim code in the fragment
   (`#code=…`). hub-client detects web-app mode by the presence of
   `./boot.json`, reads the code, exchanges it for a session
   (`POST {sessionBaseUrl}/api/v1/web-endpoints/{urlId}/session`), scrubs the
   code from the URL, and connects to PhyHub. Token refresh, reconnects, and
   rotation are handled internally — the whole lifecycle logs verbosely to the
   browser console for now.
3. Settings resolve like they do for devices: endpoint-level override →
   space-level override → installation settings. They arrive on the Web twin
   with the `webAppAuthenticated` ack.

## Development

```bash
bun install
bun run dev
```

There is no deployed `boot.json` in dev, so create a git-ignored
`public/boot.json` (vite serves it at `/boot.json`, which is how hub-client
detects web-app mode):

```json
{
  "urlId": "my-endpoint",
  "phyhubUrl": "http://localhost:14401",
  "sessionBaseUrl": "http://localhost:14400"
}
```

Then open `http://localhost:3000/#code=<claim-code>` with a freshly minted claim
code. Codes are one-time: after a page reload, mint a new one.

Simulator support (`phy-simulator`) is not wired up yet.

## Settings schema

`src/schema.ts` defines the installation settings (compiled to `build/schema.json`
by `@phystack/ts-schema`). `src/analytics-schema.ts` declares the analytics cards
shown in the Console reports view.

## Publish

```bash
phy app create <name> --type web        # once
bun run pub                             # build + submit + publish
```

`bun run pub` packages the `build/` output into a `.gridapp` and publishes it via
`phy app build create $npm_package_name --dir . --publish`. Publishing redeploys
the bundle to every enabled web endpoint of each installation on the published
build.

## Relation to template-web-react

This directory is the in-monorepo copy of
[template-web-react](https://github.com/phystack/template-web-react) (the
`v2` branch `phy app init --type web` clones). Two intentional differences:

- `"@phystack/hub-client"` is `workspace:*` here (builds against the local
  package) vs the published range in the template repo.
- The template repo carries its own README/CLAUDE.md written for scaffolded
  users.

Everything else is lockstep — if you change shared parts here, push the same
change to the template repo (and vice versa).
