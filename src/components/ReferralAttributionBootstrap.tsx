import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  applyDeferredReferralOnFirstOpen,
  captureReferralFromCurrentLocation,
  captureReferralFromUrl,
} from "@/lib/referralAttribution";

/**
 * Web + in-app: capture ?ref= on load; apply deferred ref on first native open.
 */
export function ReferralAttributionBootstrap() {
  const location = useLocation();

  useEffect(() => {
    applyDeferredReferralOnFirstOpen();
    captureReferralFromCurrentLocation();
  }, []);

  useEffect(() => {
    captureReferralFromUrl(window.location.href);
  }, [location.pathname, location.search]);

  return null;
}
