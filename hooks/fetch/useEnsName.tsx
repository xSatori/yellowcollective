import type { GetEnsNameReturnType } from "data/ens";
import useSWR from "swr";
import { Address } from "viem";

export default function useEnsName(address?: Address) {
  return useSWR<GetEnsNameReturnType>(
    address ? `/api/ens/name/${address}` : undefined
  );
}
