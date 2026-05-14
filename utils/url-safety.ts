const OBFUSCATION_PATTERN = /[\u0000-\u001f\u007f-\u009f\u200b-\u200d\ufeff]/g;
const SCHEME_WITH_WHITESPACE_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*\s+:/;
const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const HTTPS_UPGRADE_HOSTS = new Set([
  "yellowcollective.art",
  "www.yellowcollective.art",
]);
const SAFE_DATA_IMAGE_PATTERN =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/;

type NormalizeSafeUrlOptions = {
  allowInternal?: boolean;
  allowLocalHttp?: boolean;
};

type NormalizeSafeImageUrlOptions = NormalizeSafeUrlOptions & {
  allowDataImages?: boolean;
};

const cleanUrlInput = (value: unknown) =>
  typeof value === "string" ? value.replace(OBFUSCATION_PATTERN, "").trim() : "";

const isSafeInternalPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");

const normalizeHttpUrl = (
  url: URL,
  { allowLocalHttp }: NormalizeSafeUrlOptions
) => {
  if (HTTPS_UPGRADE_HOSTS.has(url.hostname)) {
    url.protocol = "https:";
    return url.toString();
  }

  if (
    allowLocalHttp &&
    process.env.NODE_ENV !== "production" &&
    LOCAL_HTTP_HOSTS.has(url.hostname)
  ) {
    return url.toString();
  }

  return "";
};

export const normalizeSafeProjectUrl = (
  value: unknown,
  options: NormalizeSafeUrlOptions = {}
) => {
  const cleaned = cleanUrlInput(value);
  if (!cleaned || SCHEME_WITH_WHITESPACE_PATTERN.test(cleaned)) return "";

  if (isSafeInternalPath(cleaned)) {
    return options.allowInternal ? cleaned : "";
  }

  if (cleaned.startsWith("//")) return "";

  try {
    const url = new URL(cleaned);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:") return normalizeHttpUrl(url, options);
    return "";
  } catch {
    return "";
  }
};

export const isSafeProjectUrl = (
  value: unknown,
  options: NormalizeSafeUrlOptions = {}
) => Boolean(normalizeSafeProjectUrl(value, options));

export const normalizeSafeImageUrl = (
  value: unknown,
  options: NormalizeSafeImageUrlOptions = {}
) => {
  const cleaned = cleanUrlInput(value);
  if (!cleaned) return "";

  if (options.allowDataImages && SAFE_DATA_IMAGE_PATTERN.test(cleaned)) {
    return cleaned;
  }

  return normalizeSafeProjectUrl(cleaned, options);
};

export const getSafeLinkProps = (
  value: unknown,
  options: NormalizeSafeUrlOptions = {}
) => {
  const href = normalizeSafeProjectUrl(value, options);
  if (!href) return null;

  const isExternal = /^https?:\/\//i.test(href);

  return {
    href,
    target: isExternal ? "_blank" : undefined,
    rel: isExternal ? "noreferrer" : undefined,
  };
};
