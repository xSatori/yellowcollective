import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import Button from "./Button";
import Image from "next/image";
import Link from "next/link";
import { FARCASTER_URL } from "constants/urls";
import { getAbsoluteUrl } from "@/utils/site";
import { isInMiniApp, loadMiniAppSdk } from "@/utils/farcasterMiniApp";
import { useEffect, useState, type MouseEvent } from "react";

const navItems = [
  {
    href: "https://warpcast.com/~/channel/yellow",
    src: "/farcaster.svg",
    label: "Farcaster",
  },
  {
    href: "https://github.com/Yellow-Collective",
    src: "/github.svg",
    label: "GitHub",
  },
];

export default function Footer() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    let cancelled = false;

    isInMiniApp().then((inMiniApp) => {
      if (!cancelled) setIsMiniApp(inMiniApp);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFarcasterClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isMiniApp) return;

    event.preventDefault();

    const sdk = await loadMiniAppSdk();
    try {
      if (sdk?.actions.composeCast) {
        await sdk.actions.composeCast({
          text: "Explore Yellow Collective",
          embeds: [getAbsoluteUrl("/")],
          channelKey: "yellow",
        });
        return;
      }

      await sdk?.actions.openUrl?.(FARCASTER_URL);
    } catch (error) {
      console.warn("Unable to open Farcaster Mini App action", error);
      window.open(FARCASTER_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-16 pb-16 pt-4">
      <div className="flex flex-wrap items-center gap-4">
        {navItems.map((item, i) => (
          <Button
            variant="secondary"
            size="rounded"
            key={i}
            className="yc-footer-icon-button"
          >
            <Link
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={item.label}
              onClick={
                item.href === FARCASTER_URL ? handleFarcasterClick : undefined
              }
            >
              <Image
                src={item.src}
                width={24}
                height={24}
                alt=""
                className="theme-tonal-icon"
              />
            </Link>
          </Button>
        ))}
        <Button
          variant="secondary"
          size="rounded"
          className="yc-footer-icon-button"
          type="button"
          aria-label="Open site information"
          onClick={() => setIsInfoOpen(true)}
        >
          <InformationCircleIcon className="h-[25px] w-[25px] text-[#212529]" />
        </Button>
      </div>

      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 py-8 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Site information"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="relative max-w-[420px] rounded-2xl border border-skin-stroke bg-primary p-6 text-center text-base leading-snug text-skin-base shadow-[0px_4.02px_0px_0px_rgb(var(--color-shadow-neutral))]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close site information"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-skin-stroke bg-primary text-skin-base shadow-[0px_3px_0px_0px_rgb(var(--color-shadow-neutral))] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] active:translate-y-1 active:shadow-none"
              onClick={() => setIsInfoOpen(false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <p className="pr-8 font-heading">
              Originally made with ❤️ by{" "}
              <Link
                href="https://paperclip.xyz"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-2 underline-offset-4 transition hover:text-[#b89400]"
              >
                Paperclip Labs
              </Link>
              . Forked and expanded by{" "}
              <Link
                href="http://farcaster.xyz/0xsatori"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-2 underline-offset-4 transition hover:text-[#b89400]"
              >
                Satori
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
