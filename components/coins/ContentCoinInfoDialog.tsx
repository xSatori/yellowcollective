import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog";
import type { ReactNode } from "react";

type ContentCoinInfoDialogProps = {
  triggerClassName?: string;
  variant?: "gallery" | "create";
};

export default function ContentCoinInfoDialog({
  triggerClassName = "",
  variant = "gallery",
}: ContentCoinInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`yc-coin-info-trigger flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7f2219] bg-[#c93d2f] font-heading text-lg text-white shadow-[0px_3px_0px_0px_#7f2219] transition hover:-translate-y-0.5 hover:bg-[#d95042] active:translate-y-0.5 active:shadow-none ${triggerClassName}`}
          aria-label="About content coins"
          title="About content coins"
        >
          i
        </button>
      </DialogTrigger>

      <DialogContent className="yc-coin-info-dialog max-h-[90vh] overflow-y-auto border border-skin-stroke bg-accent p-6 pr-14 text-[#212529] shadow-[0px_6px_0px_0px_rgb(var(--color-shadow-accent))]">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl leading-none">
            Content coins
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-base leading-snug">
          <p>
            Content coins are Zora ERC-20 coins for individual posts on Base.
            Each post gets its own coin contract, metadata, media, and Gallery
            page.
          </p>

          <InfoSection title="How Yellow uses them">
            <InfoItem>
              Every post is paired with $YELLOW, so the post coin trades against
              Yellow&apos;s fixed Base pairing coin.
            </InfoItem>
            <InfoItem>
              Creators can publish directly, or package the same transaction as
              a Droposal for DAO execution.
            </InfoItem>
            <InfoItem>
              The payout recipient is the creator fee address for the coin, and
              the owner address controls the deployed post coin.
            </InfoItem>
          </InfoSection>

          {variant === "create" && (
            <InfoSection title="Create vs Droposal">
              <InfoItem>
                Create deploys the post coin from your connected wallet right
                away. You sign the transaction, pay Base gas, and the coin
                launches after confirmation.
              </InfoItem>
              <InfoItem>
                Droposal submits the same coin deployment as a DAO proposal. You
                need proposal power, the DAO votes on it, and the coin only
                launches if the proposal is later executed.
              </InfoItem>
            </InfoSection>
          )}

          <InfoSection title="What happens after launch">
            <InfoItem>
              The post coin becomes tradeable through its Zora/Uniswap pool.
            </InfoItem>
            <InfoItem>
              Trading activity generates protocol rewards and fees; creator
              rewards are paid to the configured payout recipient.
            </InfoItem>
            <InfoItem>
              The coin can appear in the Yellow Gallery, on the owner&apos;s
              profile, and can be submitted to eligible rounds.
            </InfoItem>
          </InfoSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const InfoSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-xl border border-[#b89400] bg-[#fff7bf] p-4">
    <h3 className="font-heading text-lg leading-none text-[#212529]">
      {title}
    </h3>
    <ul className="mt-3 space-y-2">{children}</ul>
  </section>
);

const InfoItem = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-2 text-sm leading-snug text-[#212529]">
    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#212529]" />
    <span>{children}</span>
  </li>
);
