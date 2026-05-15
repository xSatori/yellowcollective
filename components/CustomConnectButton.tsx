import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "./Button";
import { Address, useDisconnect } from "wagmi";
import clsx from "clsx";
import Link from "next/link";
import WalletInfo from "./WalletInfo";
import { useEffect, useRef, useState } from "react";

export type CustomConnectButtonProps = {
  className: string;
};

const CustomConnectButton = ({ className }: CustomConnectButtonProps) => {
  const { disconnect } = useDisconnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const connectButtonClassName = clsx("yc-connect-wallet-button", className);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!mounted || !account || !chain) {
                return (
                  <Button
                    variant="secondary"
                    onClick={openConnectModal}
                    className={connectButtonClassName}
                  >
                    Connect
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    variant="negative"
                    onClick={openChainModal}
                    className={className}
                  >
                    Wrong network
                  </Button>
                );
              }
              return (
                <div className="group relative" ref={menuRef}>
                  <Button
                    variant="secondary"
                    className={clsx(
                      "flex flex-row gap-2",
                      connectButtonClassName
                    )}
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                  >
                    <WalletInfo
                      address={account.address as Address}
                      size="sm"
                    />
                  </Button>
                  <div
                    className={clsx(
                      "absolute right-0 top-full z-50 flex min-w-[190px] translate-y-2 flex-col rounded-2xl border border-skin-stroke bg-primary p-2 opacity-0 shadow-[0px_4.02px_0px_0px_rgb(var(--color-shadow-neutral))] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100",
                      isMenuOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible"
                    )}
                  >
                    <Link
                      href={`/profile/${account.address}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-xl px-4 py-3 font-bold text-primary transition hover:bg-[#fff7bf]"
                    >
                      <h6>View profile</h6>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        disconnect();
                        setIsMenuOpen(false);
                      }}
                      className="rounded-xl px-4 py-3 text-left font-bold text-negative transition hover:bg-negative hover:text-white"
                    >
                      <h6>Disconnect wallet</h6>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
