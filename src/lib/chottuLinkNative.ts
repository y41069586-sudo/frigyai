import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export type ChottuLinkResolvedLink = {
  link?: string | null;
  shortLink?: string | null;
};

export type ChottuLinkInitSuccessEvent = {
  apiKey: string;
};

export type ChottuLinkDeepLinkResolvedEvent = {
  url: string;
  metadata: Record<string, string>;
};

export type ChottuLinkDeepLinkFailedEvent = {
  originalUrl?: string;
  error: string;
  errorCode: number;
};

export type ChottuLinkInitializeOptions = {
  apiKey: string;
  debug?: boolean;
};

export type ChottuLinkHandleLinkOptions = {
  url: string;
};

export interface ChottuLinkPlugin {
  initialize(options: ChottuLinkInitializeOptions): Promise<void>;
  handleLink(options: ChottuLinkHandleLinkOptions): Promise<void>;
  getAppLinkDataFromUrl(options: ChottuLinkHandleLinkOptions): Promise<ChottuLinkResolvedLink>;
  addListener(
    eventName: "initializationSuccess",
    listenerFunc: (event: ChottuLinkInitSuccessEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "deepLinkResolved",
    listenerFunc: (event: ChottuLinkDeepLinkResolvedEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "deepLinkFailed",
    listenerFunc: (event: ChottuLinkDeepLinkFailedEvent) => void,
  ): Promise<PluginListenerHandle>;
}

export const ChottuLinkNative = registerPlugin<ChottuLinkPlugin>("ChottuLink");
