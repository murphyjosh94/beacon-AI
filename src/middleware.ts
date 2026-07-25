import { NextRequest, NextResponse } from "next/server";

const PUBLIC_SITE_PREFIX = "/_sites";
const DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
]);

const DEFAULT_PLATFORM_HOSTS = new Set([
  "beacon-ai.co.uk",
  "www.beacon-ai.co.uk",
]);

function normaliseHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function readConfiguredPlatformHosts() {
  const configured = process.env.BEACON_PLATFORM_HOSTS ?? "";

  return configured
    .split(",")
    .map(normaliseHost)
    .filter(Boolean);
}

function getPlatformHosts() {
  const hosts = new Set(DEFAULT_PLATFORM_HOSTS);

  for (const configuredHost of readConfiguredPlatformHosts()) {
    hosts.add(configuredHost);
  }

  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (publicSiteUrl) {
    try {
      hosts.add(normaliseHost(new URL(publicSiteUrl).hostname));
    } catch {
      // Ignore an invalid optional URL here. The application can validate it
      // separately where NEXT_PUBLIC_SITE_URL is required.
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    hosts.add(normaliseHost(vercelUrl));
  }

  return hosts;
}

function isDevelopmentHost(host: string) {
  if (DEVELOPMENT_HOSTS.has(host)) {
    return true;
  }

  return (
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".test")
  );
}

function isPlatformHost(host: string) {
  const platformHosts = getPlatformHosts();

  if (platformHosts.has(host)) {
    return true;
  }

  for (const platformHost of platformHosts) {
    if (
      platformHost &&
      host.endsWith(`.${platformHost}`) &&
      !host.endsWith(".beaconbusiness.site")
    ) {
      return true;
    }
  }

  return false;
}

function isInternalPath(pathname: string) {
  return (
    pathname === PUBLIC_SITE_PREFIX ||
    pathname.startsWith(`${PUBLIC_SITE_PREFIX}/`) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/business/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  );
}

function isPublicFile(pathname: string) {
  return (
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/site.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/assets/")
  );
}

function shouldRenderPublishedWebsite(
  host: string,
  pathname: string,
) {
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

export function middleware(request: NextRequest) {
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
    "/((?!_next/static|_next/image|api|favicon.ico|.*\\.[^/]+$).*)",
  ],
};