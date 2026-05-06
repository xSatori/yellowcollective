import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "./Button";
import { Address } from "wagmi";
import clsx from "clsx";
import WalletInfo from "./WalletInfo";

export type CustomConnectButtonProps = {
  className: string;
};

const CustomConnectButton = ({ className }: CustomConnectButtonProps) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
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
                    className={className}
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
                <Button
                  variant="secondary"
                  onClick={openAccountModal}
                  className={clsx("flex flex-row gap-2", className)}
                >
                  <WalletInfo address={account.address as Address} size="sm" />
                </Button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
