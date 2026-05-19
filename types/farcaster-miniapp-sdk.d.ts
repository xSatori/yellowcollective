declare module "@farcaster/miniapp-sdk" {
  import type { MiniAppSdk } from "@/utils/farcasterMiniApp";

  export const sdk: MiniAppSdk;
  const defaultSdk: MiniAppSdk;
  export default defaultSdk;
}
