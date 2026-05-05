import { formatNumber } from "@/utils/formatNumber";
import { useNounsBalance } from "@/hooks/fetch/useNounsBalance";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Button from "./Button";
import CustomConnectButton from "./CustomConnectButton";
import Image from "next/image";
import Link from "next/link";
import { BASED_AND_YELLOW_MULTISIG, TOKEN_CONTRACT } from "constants/addresses";
import { BigNumber, ethers } from "ethers";
import { ETHERSCAN_BASEURL } from "constants/urls";
import { useBalance } from "wagmi";
import { useDAOAddresses, useTreasuryBalance } from "hooks";
import { useEffect, useMemo, useState } from "react";

const daoItems = [
  { label: "About", href: "/about" },
  { label: "Proposals", href: "/proposals" },
  { label: "Treasury", href: "/treasury" },
  { label: "Contracts", href: "/contracts" },
];

export default function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const { data: addresses } = useDAOAddresses({
    tokenContract: TOKEN_CONTRACT,
  });
  const { data: treasury } = useTreasuryBalance({
    treasuryContract: addresses?.treasury,
  });
  const { data: treasuryNounsBalance } = useNounsBalance({
    user: addresses?.treasury,
  });

  const { data: multisigBalanceData } = useBalance({
    address: BASED_AND_YELLOW_MULTISIG,
  });
  const { data: multisigNounsBalance } = useNounsBalance({
    user: BASED_AND_YELLOW_MULTISIG,
  });

  const nounsBalance = BigNumber.from(treasuryNounsBalance ?? 0).add(
    BigNumber.from(multisigNounsBalance ?? 0)
  );
  const multisigBalance = multisigBalanceData?.value ?? BigNumber.from(0);
  const balanceLabel = useMemo(() => {
    if (!isMounted) return "0";

    const parts = [
      treasury ? formatNumber(ethers.utils.formatEther(treasury), 2) : "0",
    ];

    if (multisigBalance.gt(1000)) {
      parts.push(formatNumber(multisigBalanceData?.formatted, 2));
    }

    if (nounsBalance.gt(0)) {
      parts.push(
        `${nounsBalance.toString()} ${nounsBalance.gt(1) ? "Nouns" : "Noun"}`
      );
    }

    return parts.join(" + ");
  }, [
    isMounted,
    multisigBalance,
    multisigBalanceData?.formatted,
    nounsBalance,
    treasury,
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex h-[80px] w-full items-center justify-between gap-2 px-4 py-2 md:px-10">
      <div className="flex flex-row items-center justify-start gap-4 md:gap-8">
        <Link href="/">
          <Image src="/noggles.svg" width={80} height={30} alt="Yellow" />
        </Link>
        <Button variant="outline" size="tight">
          <Link
            href={`${ETHERSCAN_BASEURL}/tokenholdings?a=${addresses?.treasury}`}
            rel="noreferer noopener noreferrer"
            target="_blank"
          >
            <h6>&Xi; {balanceLabel}</h6>
          </Link>
        </Button>
      </div>

      <div className="hidden flex-1 items-center justify-end gap-2 px-4 lg:flex">
        <Link
          href="/"
          className="rounded-[18px] px-4 py-[13px] font-bold text-primary transition ease-in-out hover:bg-[#181818]/10"
        >
          <h6>Home</h6>
        </Link>
        <Link
          href="/community"
          className="rounded-[18px] px-4 py-[13px] font-bold text-primary transition ease-in-out hover:bg-[#181818]/10"
        >
          <h6>Community</h6>
        </Link>

        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-1 rounded-[18px] px-4 py-[13px] font-bold text-primary transition ease-in-out hover:bg-[#181818]/10"
          >
            <h6>DAO</h6>
            <ChevronDownIcon className="h-4 w-4 stroke-[3]" />
          </button>

          <div className="invisible absolute right-0 top-full z-50 flex w-48 translate-y-2 flex-col rounded-2xl border border-skin-stroke bg-skin-muted p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            {daoItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 font-bold text-primary transition hover:bg-[#fff7bf]"
              >
                <h6>{item.label}</h6>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <CustomConnectButton className="h-10 rounded-xl border border-skin-stroke bg-skin-backdrop px-6 text-skin-base transition ease-in-out hover:scale-110" />
    </div>
  );
}
