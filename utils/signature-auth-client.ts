import {
  buildSignedRequestMessage,
  createRequestPayloadHash,
  createSignedRequestAuthorizationHeader,
  normalizeSignedRequestMethod,
  normalizeSignedRequestPath,
  normalizeSignedRequestWallet,
  type SignedRequestChallenge,
  type SignedRequestMethod,
} from "./signature-auth";

type SignMessageAsync = (args: { message: string }) => Promise<string>;

type CreateSignedRequestAuthHeaderInput = {
  walletAddress: string;
  chainId: number;
  action: string;
  method: SignedRequestMethod | string;
  path: string;
  payload?: unknown;
  signMessageAsync: SignMessageAsync;
};

export const createSignedRequestAuthHeader = async ({
  walletAddress,
  chainId,
  action,
  method,
  path,
  payload = {},
  signMessageAsync,
}: CreateSignedRequestAuthHeaderInput) => {
  const normalizedMethod = normalizeSignedRequestMethod(method);
  if (!normalizedMethod) throw new Error("Invalid signed request method.");

  const challengeRequest = {
    walletAddress: normalizeSignedRequestWallet(walletAddress),
    chainId,
    action,
    method: normalizedMethod,
    path: normalizeSignedRequestPath(path),
    payloadHash: createRequestPayloadHash(payload),
  };
  const response = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(challengeRequest),
  });
  const data = (await response.json().catch(() => ({}))) as {
    challenge?: SignedRequestChallenge;
    message?: string;
    error?: string;
  };

  if (!response.ok || !data.challenge || !data.message) {
    throw new Error(data.error || "Unable to create signing challenge.");
  }

  const expectedMessage = buildSignedRequestMessage(data.challenge);
  if (data.message !== expectedMessage) {
    throw new Error("Signing challenge mismatch.");
  }

  const signature = (await signMessageAsync({
    message: data.message,
  })) as `0x${string}`;

  return createSignedRequestAuthorizationHeader({
    nonce: data.challenge.nonce,
    walletAddress: data.challenge.walletAddress,
    signature,
  });
};
