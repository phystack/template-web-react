/**
 * Boot descriptor resolution for a deployed web app.
 *
 * The deploys service publishes a static `boot.json` next to the app bundle
 * (`{urlId}/boot.json`) with routing info only — no settings, no secrets:
 *
 *   { "urlId": "...", "region": "eu", "phyhubUrl": "https://...", "coreApiUrl": "https://..." }
 *
 * Settings arrive later over the authenticated web session (the Web twin on
 * the `webAppAuthenticated` ack), never via static hosting.
 *
 * For local development (`bun run dev`) there is no deployed `boot.json`, so
 * the same fields can be supplied via Vite env vars:
 *
 *   VITE_WEB_URL_ID, VITE_WEB_REGION, VITE_PHYHUB_URL, VITE_CORE_API_URL
 */

export interface WebAppBoot {
  urlId: string;
  region: string;
  phyhubUrl: string;
  coreApiUrl: string;
}

/**
 * The base URL the hub-client session exchange appends
 * `/api/v1/web-endpoints/{urlId}/session` to. The public mint route is served
 * by phyhub through the API gateway's regional passthrough.
 */
export function sessionBaseUrl(boot: WebAppBoot): string {
  return `${boot.coreApiUrl.replace(/\/$/, "")}/regions/${boot.region}/phyhub`;
}

function bootFromEnv(): WebAppBoot | null {
  const env = import.meta.env;
  const urlId = env.VITE_WEB_URL_ID as string | undefined;
  const region = env.VITE_WEB_REGION as string | undefined;
  const phyhubUrl = env.VITE_PHYHUB_URL as string | undefined;
  const coreApiUrl = env.VITE_CORE_API_URL as string | undefined;
  if (!urlId || !region || !phyhubUrl || !coreApiUrl) return null;
  return { urlId, region, phyhubUrl, coreApiUrl };
}

export async function loadBoot(): Promise<WebAppBoot> {
  try {
    const response = await fetch("./boot.json", { cache: "no-store" });
    if (response.ok) {
      const boot = (await response.json()) as Partial<WebAppBoot>;
      if (boot.urlId && boot.region && boot.phyhubUrl && boot.coreApiUrl) {
        return boot as WebAppBoot;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch boot.json, falling back to env", error);
  }

  const fromEnv = bootFromEnv();
  if (fromEnv) return fromEnv;

  throw new Error(
    "No boot descriptor: boot.json is missing and VITE_WEB_URL_ID / " +
      "VITE_WEB_REGION / VITE_PHYHUB_URL / VITE_CORE_API_URL are not set"
  );
}
