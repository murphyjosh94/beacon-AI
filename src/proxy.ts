import { NextRequest, NextResponse } from "next/server";

const PUBLIC_SITE_PREFIX = "/sites";

const DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
]);

const DEFAULT_PLATFORM_HOSTS = new Set([
  "beacon-ai.co.uk",
  "www.beacon-ai.co.uk",
]);

function normaliseHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function readConfiguredPlatformHosts(): string[] {
  const configuredHosts = process.env.BEACON_PLATFORM_HOSTS ?? "";

  return configuredHosts
    .split(",")
    .map(normaliseHost)
    .filter(Boolean);
}

function addUrlHost(hosts: Set<string>, value?: string): void {
  const configuredValue = value?.trim();

  if (!configuredValue) {
    return;
  }

  try {
    const url = configuredValue.includes("://")
      ? new URL(configuredValue)
      : new URL(`https://${configuredValue}`);

    const host = normaliseHost(url.hostname);

    if (host) {
      hosts.add(host);
    }
  } catch {
    // Optional environment values are ignored when malformed.
  }
}

function getPlatformHosts(): Set<string> {
  const hosts = new Set(DEFAULT_PLATFORM_HOSTS);

  for (const configuredHost of readConfiguredPlatformHosts()) {
    hosts.add(configuredHost);
  }

  addUrlHost(hosts, process.env.NEXT_PUBLIC_SITE_URL);
  addUrlHost(hosts, process.env.VERCEL_URL);
  addUrlHost(hosts, process.env.VERCEL_PROJECT_PRODUCTION_URL);
  addUrlHost(hosts, process.env.VERCEL_BRANCH_URL);

  return hosts;
}

function isDevelopmentHost(host: string): boolean {
  return (
    DEVELOPMENT_HOSTS.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".test")
  );
}

function isBeaconPublishedSiteHost(host: string): boolean {
  return (
    host === "beaconbusiness.site" ||
    host.endsWith(".beaconbusiness.site")
  );
}

function isPlatformHost(host: string): boolean {
  if (!host) {
    return false;
  }

  if (isBeaconPublishedSiteHost(host)) {
    return false;
  }

  const platformHosts = getPlatformHosts();

  if (platformHosts.has(host)) {
    return true;
  }

  for (const platformHost of platformHosts) {
    if (
      platformHost &&
      !isBeaconPublishedSiteHost(platformHost) &&
      host.endsWith(`.${platformHost}`)
    ) {
      return true;
    }
  }

  return false;
}

function isInternalPath(pathname: string): boolean {
  const exactInternalPaths = new Set([
    "/",
    "/account",
    "/admin",
    "/affiliate-disclosure",
    "/business",
    "/cookies",
    "/dashboard",
    "/membership",
    "/my-beacon",
    "/partners",
    "/pricing",
    "/privacy",
    "/refunds",
    "/robots.txt",
    "/signin",
    "/signup",
    "/sitemap.xml",
    "/terms",
  ]);

  if (exactInternalPaths.has(pathname)) {
    return true;
  }

  const internalPrefixes = [
    "/_next/",
    "/api/",
    "/account/",
    "/admin/",
    "/auth/",
    "/business/",
    "/dashboard/",
    "/membership/",
    "/my-beacon/",
    "/search/",
    "/signin/",
    "/signup/",
    `${PUBLIC_SITE_PREFIX}/`,
  ];

  return internalPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isPublicFile(pathname: string): boolean {
  return (
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/site.webmanifest" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/assets/") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function shouldRenderPublishedWebsite(
  host: string,
  pathname: string,
): boolean {
  if (!host || isDevelopmentHost(host)) {
    return false;
  }

  if (isPlatformHost(host)) {
    return false;
  }

  if (isInternalPath(pathname) || isPublicFile(pathname)) {
    return false;
  }

  return true;
}

export function proxy(request: NextRequest) {
  const forwardedHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  const host = normaliseHost(forwardedHost);
  const pathname = request.nextUrl.pathname;

  if (!shouldRenderPublishedWebsite(host, pathname)) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();

  rewriteUrl.pathname =
    pathname === "/"
      ? PUBLIC_SITE_PREFIX
      : `${PUBLIC_SITE_PREFIX}${pathname}`;

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-beacon-site-host", host);
  requestHeaders.set("x-beacon-original-path", pathname);

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};