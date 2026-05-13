import { verifyMessage } from "viem";
import { getAddress, isAddress } from "viem";

export type RoundAction = "submit" | "submit-trait" | "vote";

export type RoundWalletAuthPayload = {
  walletAddress?: string;
  walletMessage?: string;
  walletSignature?: string;
};

export const ROUND_AUTH_MESSAGE_PREFIX = "Yellow Collective rounds";
export const ROUND_AUTH_TTL_MS = 5 * 60 * 1000;

export const createRoundActionMessage = ({
  action,
  roundSlug,
  walletAddress,
  issuedAt = Date.now(),
}: {
  action: RoundAction;
  roundSlug: string;
  walletAddress: string;
  issuedAt?: number;
}) => `${ROUND_AUTH_MESSAGE_PREFIX}
Action: ${action}
Round: ${roundSlug}
Wallet: ${getAddress(walletAddress)}
Issued At: ${issuedAt}`;

const parseRoundActionMessage = (message: string) => {
  const lines = message.split("\n");
  if (lines[0] !== ROUND_AUTH_MESSAGE_PREFIX) return null;

  const getLine = (prefix: string) =>
    lines
      .find((line) => line.startsWith(prefix))
      ?.replace(prefix, "")
      .trim();

  const action = getLine("Action: ") as RoundAction | undefined;
  const roundSlug = getLine("Round: ");
  const wallet = getLine("Wallet: ");
  const issuedAt = Number(getLine("Issued At: "));

  if (
    (action !== "submit" && action !== "submit-trait" && action !== "vote") ||
    !roundSlug ||
    !wallet ||
    !isAddress(wallet) ||
    !Number.isFinite(issuedAt)
  ) {
    return null;
  }

  return {
    action,
    roundSlug,
    wallet: getAddress(wallet),
    issuedAt,
  };
};

export const verifyRoundWalletAuth = async ({
  payload,
  action,
  roundSlug,
}: {
  payload: RoundWalletAuthPayload;
  action: RoundAction;
  roundSlug: string;
}) => {
  const { walletAddress, walletMessage, walletSignature } = payload;

  if (
    typeof walletAddress !== "string" ||
    typeof walletMessage !== "string" ||
    typeof walletSignature !== "string" ||
    !isAddress(walletAddress)
  ) {
    throw new Error("Wallet signature required.");
  }

  const parsed = parseRoundActionMessage(walletMessage);
  const normalizedWallet = getAddress(walletAddress);
  const now = Date.now();

  if (
    !parsed ||
    parsed.action !== action ||
    parsed.roundSlug !== roundSlug ||
    parsed.wallet !== normalizedWallet ||
    now - parsed.issuedAt < 0 ||
    now - parsed.issuedAt > ROUND_AUTH_TTL_MS
  ) {
    throw new Error("Wallet signature message is invalid or expired.");
  }

  const isValid = await verifyMessage({
    address: normalizedWallet,
    message: walletMessage,
    signature: walletSignature as `0x${string}`,
  });

  if (!isValid) {
    throw new Error("Wallet signature invalid.");
  }

  return normalizedWallet;
};
