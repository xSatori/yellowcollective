import {
  getMiniAppContext,
  isInMiniApp,
  loadMiniAppSdk,
} from "@/utils/farcasterMiniApp";
import { useEffect } from "react";

const setSafeAreaVars = (safeAreaInsets?: {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) => {
  const root = document.documentElement;
  const top = safeAreaInsets?.top ?? 0;
  const bottom = safeAreaInsets?.bottom ?? 0;
  const left = safeAreaInsets?.left ?? 0;
  const right = safeAreaInsets?.right ?? 0;

  root.style.setProperty("--miniapp-safe-area-top", `${top}px`);
  root.style.setProperty("--miniapp-safe-area-bottom", `${bottom}px`);
  root.style.setProperty("--miniapp-safe-area-left", `${left}px`);
  root.style.setProperty("--miniapp-safe-area-right", `${right}px`);
};

export default function MiniAppReady() {
  useEffect(() => {
    let cancelled = false;

    const initializeMiniApp = async () => {
      const inMiniApp = await isInMiniApp();
      if (!inMiniApp || cancelled) return;

      document.documentElement.dataset.farcasterMiniApp = "true";

      const [sdk, context] = await Promise.all([
        loadMiniAppSdk(),
        getMiniAppContext(),
      ]);
      if (cancelled) return;

      setSafeAreaVars(context?.client?.safeAreaInsets);

      try {
        await sdk?.actions.ready();
      } catch (error) {
        console.warn("Unable to signal Farcaster Mini App ready state", error);
      }
    };

    initializeMiniApp();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
