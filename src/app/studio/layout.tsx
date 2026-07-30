import type {
  ReactNode,
} from "react";

import StudioSiteChrome from "./_components/StudioSiteChrome";

export const dynamic =
  "force-dynamic";

export default function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <StudioSiteChrome>
      {children}
    </StudioSiteChrome>
  );
}