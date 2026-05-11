import type { GetEnsNamesReturnType } from "pages/api/ens/names";
import useSWR from "swr";
import { getAddress, isAddress } from "viem";

const normalizeAddresses = (addresses: string[]) =>
  Array.from(
    new Set(
      addresses
        .filter((address) => isAddress(address))
        .map((address) => getAddress(address))
    )
  ).sort((first, second) => first.localeCompare(second));

export default function useEnsNames(addresses: string[] = []) {
  const normalizedAddresses = normalizeAddresses(addresses);
  const addressKey = normalizedAddresses.join(",");

  return useSWR<GetEnsNamesReturnType>(
    normalizedAddresses.length ? `/api/ens/names:${addressKey}` : undefined,
    async () => {
      const response = await fetch("/api/ens/names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: normalizedAddresses }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to resolve ENS names.");
      }

      return data;
    }
  );
}
