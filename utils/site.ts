export const SITE_NAME = "Yellow Collective";
export const SITE_SHORT_NAME = "Yellow";
export const SITE_DESCRIPTION =
  "A club on Base supporting artists and creatives in the Nouns and Superchain ecosystems.";
export const SITE_THEME_COLOR = "#FCD100";
export const SITE_BACKGROUND_COLOR = "#FFF7BF";
export const SITE_DOMAIN = "yellowcollective.art";
export const DEFAULT_SITE_URL = `https://${SITE_DOMAIN}`;

const normalizeSiteUrl = (url?: string) => {
  if (!url) return DEFAULT_SITE_URL;

  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  return withProtocol.replace(/\/+$/, "");
};

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL
);

export const getAbsoluteUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${SITE_URL}${normalizedPath}`;
};

export const MINI_APP_EMBED = {
  version: "1",
  imageUrl: getAbsoluteUrl("/miniapp-embed.png"),
  button: {
    title: "Open Yellow",
    action: {
      type: "launch_frame",
      name: SITE_NAME,
      url: SITE_URL,
      splashImageUrl: getAbsoluteUrl("/miniapp-splash.png"),
      splashBackgroundColor: SITE_THEME_COLOR,
    },
  },
};

export const LEGACY_FRAME_EMBED = {
  ...MINI_APP_EMBED,
  button: {
    ...MINI_APP_EMBED.button,
    action: {
      ...MINI_APP_EMBED.button.action,
      type: "launch_frame",
    },
  },
};

export const MINI_APP_EMBED_JSON = JSON.stringify(MINI_APP_EMBED);
export const LEGACY_FRAME_EMBED_JSON = JSON.stringify(LEGACY_FRAME_EMBED);
