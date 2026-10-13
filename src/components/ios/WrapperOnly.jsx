import React from "react";
import { useLocation } from "react-router-dom";
import useIsIOSWrapper from "@/hooks/useIsIOSWrapper";
import BrowserLandingPage from "@/components/ios/BrowserLandingPage";

// Legal pages stay reachable from a browser (store review, shared links).
const PUBLIC_BROWSER_PATHS = ["/privacy", "/terms", "/medical-disclaimer", "/about-sources"];

export default function WrapperOnly({ children }) {
  const isWrapper = useIsIOSWrapper();
  const { pathname } = useLocation();

  if (isWrapper === null) return null;
  if (isWrapper) return <>{children}</>;
  const isPublic = PUBLIC_BROWSER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return isPublic ? <>{children}</> : <BrowserLandingPage />;
}