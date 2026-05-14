export type MiniAppSafeAreaInsets = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type MiniAppContext = {
  client?: {
    safeAreaInsets?: MiniAppSafeAreaInsets;
  };
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
};

export type MiniAppSdk = {
  isInMiniApp: () => Promise<boolean>;
  context?: MiniAppContext | Promise<MiniAppContext>;
  actions: {
    ready: () => Promise<void>;
    composeCast?: (options: {
      text?: string;
      embeds?: string[];
      channelKey?: string;
    }) => Promise<unknown>;
    openUrl?: (url: string) => Promise<void>;
  };
};

const SDK_URL = "https://esm.sh/@farcaster/miniapp-sdk";

let sdkPromise: Promise<MiniAppSdk | null> | null = null;
let miniAppCheckPromise: Promise<boolean> | null = null;

export const loadMiniAppSdk = async () => {
  if (typeof window === "undefined") return null;

  if (!sdkPromise) {
    sdkPromise = (async () => {
      try {
        const importRemote = new Function("url", "return import(url)") as (
          url: string
        ) => Promise<{ sdk?: MiniAppSdk; default?: MiniAppSdk }>;
        const module = await importRemote(SDK_URL);

        return module.sdk || module.default || null;
      } catch (error) {
        console.warn("Unable to load Farcaster Mini App SDK", error);
        return null;
      }
    })();
  }

  return sdkPromise;
};

export const isInMiniApp = async () => {
  if (!miniAppCheckPromise) {
    miniAppCheckPromise = (async () => {
      const sdk = await loadMiniAppSdk();
      if (!sdk) return false;

      try {
        return await sdk.isInMiniApp();
      } catch (error) {
        console.warn("Unable to detect Farcaster Mini App context", error);
        return false;
      }
    })();
  }

  return miniAppCheckPromise;
};

export const getMiniAppContext = async () => {
  const sdk = await loadMiniAppSdk();
  if (!sdk?.context) return null;

  try {
    return await Promise.resolve(sdk.context);
  } catch (error) {
    console.warn("Unable to read Farcaster Mini App context", error);
    return null;
  }
};
