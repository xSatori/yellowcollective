import useEnsName from "@/hooks/fetch/useEnsName";
import { shortenAddress } from "@/utils/shortenAddress";
import { ETHERSCAN_BASEURL } from "constants/urls";
import Link from "next/link";
import type { ReactNode } from "react";
import { Address, getAddress, isAddress } from "viem";

type AddressLinkProps = {
  address: string;
  className?: string;
  fallback?: "short" | "full";
  fallbackAmount?: number;
  link?: boolean;
  children?: ReactNode;
};

export default function AddressLink({
  address,
  className,
  fallback = "short",
  fallbackAmount = 4,
  link = true,
  children,
}: AddressLinkProps) {
  const normalizedAddress = isAddress(address) ? getAddress(address) : undefined;
  const { data } = useEnsName(normalizedAddress as Address | undefined);

  if (!normalizedAddress) {
    return <span className={className}>{children || address}</span>;
  }

  const fallbackLabel =
    fallback === "full"
      ? normalizedAddress
      : shortenAddress(normalizedAddress, fallbackAmount);
  const label = data?.ensName || children || fallbackLabel;

  if (!link) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      href={`${ETHERSCAN_BASEURL}/address/${normalizedAddress}`}
      rel="noopener noreferrer"
      target="_blank"
      className={className}
    >
      {label}
    </Link>
  );
}
