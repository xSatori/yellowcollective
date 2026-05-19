import type { NextApiRequest, NextApiResponse } from "next";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

const getHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const getRequestIp = (req: NextApiRequest) => {
  const forwardedFor = getHeaderValue(req.headers["x-forwarded-for"]);
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return (
    getHeaderValue(req.headers["x-real-ip"]) ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

export const checkRateLimit = ({
  key,
  limit,
  windowMs,
}: RateLimitOptions) => {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
};

export const applyRateLimit = (
  req: NextApiRequest,
  res: NextApiResponse,
  options: Omit<RateLimitOptions, "key"> & { keyPrefix: string }
) => {
  const result = checkRateLimit({
    key: `${options.keyPrefix}:${getRequestIp(req)}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  );

  res.setHeader("X-RateLimit-Limit", String(options.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return false;
  }

  return true;
};

export const resetRateLimitsForTests = () => {
  buckets.clear();
};
