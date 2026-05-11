import { isAdminAddress } from "./admin";

export type AdminAuthPayload = {
  adminAddress?: string;
  adminMessage?: string;
  adminSignature?: string;
};

export const ADMIN_AUTH_MESSAGE_PREFIX =
  "Yellow Collective admin dashboard access";

export const ADMIN_AUTH_TTL_MS = 5 * 60 * 1000;

export const createAdminAuthMessage = (
  address: string,
  issuedAt = Date.now()
) => `${ADMIN_AUTH_MESSAGE_PREFIX}
Wallet: ${address}
Issued At: ${issuedAt}`;

export const parseAdminAuthMessage = (message: string) => {
  const lines = message.split("\n");
  if (lines[0] !== ADMIN_AUTH_MESSAGE_PREFIX) return null;

  const wallet = lines
    .find((line) => line.startsWith("Wallet: "))
    ?.replace("Wallet: ", "")
    .trim();
  const issuedAtValue = lines
    .find((line) => line.startsWith("Issued At: "))
    ?.replace("Issued At: ", "")
    .trim();
  const issuedAt = Number(issuedAtValue);

  if (!wallet || !Number.isFinite(issuedAt)) return null;

  return { wallet, issuedAt };
};

export const isFreshAdminAuthMessage = (
  issuedAt: number,
  now = Date.now()
) =>
  Number.isFinite(issuedAt) &&
  now - issuedAt >= 0 &&
  now - issuedAt <= ADMIN_AUTH_TTL_MS;

export const isAdminAuthMessageForAddress = (
  message: string,
  address: string
) => {
  const parsed = parseAdminAuthMessage(message);

  return Boolean(
    parsed &&
      isAdminAddress(parsed.wallet) &&
      isAdminAddress(address) &&
      parsed.wallet.toLowerCase() === address.toLowerCase() &&
      isFreshAdminAuthMessage(parsed.issuedAt)
  );
};
