import { viemMainnetClient } from "configs/wallet";
import { Address } from "viem";

export interface GetEnsNameReturnType {
  ensName?: string;
}

export async function getEnsName({
  address,
}: {
  address: Address;
}): Promise<GetEnsNameReturnType> {
  try {
    const ensName = await viemMainnetClient.getEnsName({ address });
    return { ensName: ensName ?? undefined };
  } catch (error) {
    console.warn("Unable to resolve ENS name", error);
    return { ensName: undefined };
  }
}

export interface GetEnsAddressReturnType {
  address?: Address;
}

export async function getEnsAddress({
  ensName,
}: {
  ensName: string;
}): Promise<GetEnsAddressReturnType> {
  try {
    const address = await viemMainnetClient.getEnsAddress({ name: ensName });
    return { address: address ?? undefined };
  } catch (error) {
    console.warn("Unable to resolve ENS address", error);
    return { address: undefined };
  }
}

export interface GetEnsAvatarReturnType {
  ensAvatar?: string;
}

export async function getEnsAvatar({
  address,
}: {
  address: Address;
}): Promise<GetEnsAvatarReturnType> {
  try {
    const { ensName } = await getEnsName({ address });
    const ensAvatar = ensName
      ? (await viemMainnetClient.getEnsAvatar({ name: ensName })) ?? undefined
      : undefined;

    return { ensAvatar };
  } catch (error) {
    return { ensAvatar: undefined };
  }
}
