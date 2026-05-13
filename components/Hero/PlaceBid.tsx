import { BigNumber, utils } from "ethers";
import Image from "next/image";
import { useState } from "react";
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
  useAccount,
  Address,
} from "wagmi";
import { AuctionABI } from "@buildersdk/sdk";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "../Button";
import clsx from "clsx";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { track } from "@vercel/analytics";
import ExternalLink from "../ExternalLink";
import { auctionAbi } from "abis/auction";

export const PlaceBid = ({
  highestBid,
  auction,
  tokenId,
  hidden,
  onNewBid,
}: {
  highestBid?: string;
  auction?: string;
  tokenId?: string;
  hidden: boolean;
  onNewBid: () => Promise<void>;
}) => {
  const { isConnected } = useAccount();
  const [bid, setBid] = useState("");
  const debouncedBid = useDebounce(bid, 500);

  const { openConnectModal } = useConnectModal();

  const { config, error } = usePrepareContractWrite({
    address: auction as Address,
    abi: auctionAbi,
    functionName: "createBidWithReferral",
    args: [
      BigNumber.from(tokenId || 1),
      "0x1C937764e433878c6eB1820bC5a1A42c6f25dA81",
    ],
    overrides: {
      value: utils.parseEther(debouncedBid || "0"),
    },
    enabled: !!auction && !!debouncedBid,
  });
  const { write, data } = useContractWrite(config);
  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onError: () => {
      track("placeBidError");
    },
    onSuccess: () => {
      setBid("");
      track("placeBidSuccess");
      onNewBid();
    },
  });

  const highestBidBN = BigNumber.from(highestBid);
  const amountIncrease = highestBidBN.div("10");
  const nextBidAmount = highestBidBN.add(amountIncrease);

  const getError = () => {
    const minNextBid = utils.formatEther(nextBidAmount);
    if (bid != "" && bid < minNextBid) {
      return `Bid must be at least ${minNextBid}`;
    }

    const reason = (error as any)?.reason;
    if (!reason) return "";

    if (reason.includes("insufficient funds"))
      return "Error insufficient funds for bid";

    if (debouncedBid && debouncedBid < utils.formatEther(nextBidAmount))
      return "Error invalid bid";
  };

  return (
    <div className={clsx("flex flex-col gap-6", hidden && "hidden")}>
      <ExternalLink href="https://bridge.base.org/deposit">
        <div className="flex flex-row gap-2">
          <Image src="/info-circle.svg" width={20} height={20} alt="" />
          <span className="font-bold">Bridge to Base</span>
        </div>
      </ExternalLink>
      <div
        className={clsx(
          "flex w-full flex-col items-start gap-4 min-[390px]:flex-row min-[390px]:flex-wrap"
        )}
      >
        <div className="flex w-full flex-col gap-1 min-[390px]:w-auto min-[390px]:shrink">
          <input
            value={bid}
            type="number"
            onChange={(e) => setBid(e.target.value)}
            className={clsx(
              "h-[59px] w-full min-w-0 rounded-[18px] border-2 bg-primary px-6 py-4 outline-none focus:border-accent min-[390px]:w-[265px]",
              getError() != undefined && getError() != "" && "border-negative"
            )}
            placeholder={
              nextBidAmount
                ? `Ξ ${utils.formatEther(nextBidAmount)} or more`
                : ""
            }
          />
          {error && <p className="caption text-negative">{getError()}</p>}
        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <Button
            disabled={(!write || isLoading) && isConnected}
            onClick={(e) => {
              e.preventDefault();
              if (isConnected) {
                track("placeBidTriggered");
                write?.();
              } else {
                openConnectModal?.();
              }
            }}
          >
            {isLoading ? (
              <Image src="/spinner.svg" height={24} width={24} alt="spinner" />
            ) : (
              "Place bid"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
