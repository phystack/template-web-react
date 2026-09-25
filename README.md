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

One command, fully local — no platform, no tenant, no device (same flow as the
screen template):

```bash
bun install
phy simulator start     # once, in a separate terminal
bun run dev
```

`bun run dev` runs `phy simulator run .`: it creates a local Web twin with
settings from `src/settings/index.json` (generated from the `src/schema.ts`
defaults on first run — delete the file to regenerate), writes a git-ignored
`public/boot.json` pointing at the simulator, and starts vite. Then open:

```
http://localhost:3000/#code=dev
```

Any `#code=` value works against the simulator. Requires
`@phystack/device-simulator` >= 6.12 (the `phy simulator` / `phy-simulator`
command).

To run vite alone against an existing `public/boot.json` (e.g. one pointing at
a real environment), use `bun run start`.

### Against a real environment

Create a git-ignored `public/boot.json` pointing at the environment (vite
serves it at `/boot.json`, which is how hub-client detects web-app mode):

```json
{
  "urlId": "{tenantSlug}/{endpoint-name}",
  "phyhubUrl": "https://phyhub.{region}.omborigrid.net",
  "sessionBaseUrl": "https://phyhub.{region}.omborigrid.net"
}
```

Then open `http://localhost:3000/#code=<claim-code>` with a freshly minted
claim code — from the Console's "Get session link" action on the web endpoint,
or `phy web-endpoint code <endpoint>`.

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

## Screen sibling

[template-screen-react](https://github.com/phystack/template-screen-react)
is the SCREEN-app variant of this template: same schema pipeline, build
output layout, and publish flow; only the connection target differs (device
twin via `#instanceId` instead of a web session via `#code`). If you change
shared parts of one template, change both.
