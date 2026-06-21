/**
 * Custom URL scheme — must match iOS Info.plist & Android intent-filter.
 *
 * Lives in its own dependency-free module so that both `appDeepLink` and
 * `chottuLinkConfig` can import it without creating a circular import
 * (which previously caused a TDZ ReferenceError at app boot).
 */
export const FRIGY_APP_SCHEME = "frigy";
