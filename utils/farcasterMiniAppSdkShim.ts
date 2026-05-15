import type { MiniAppSdk } from "./farcasterMiniApp";

const sdk: MiniAppSdk = {
  isInMiniApp: async () => false,
  actions: {
    ready: async () => undefined,
  },
};

export { sdk };
export default sdk;
