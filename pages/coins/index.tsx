import Layout from "@/components/Layout";
import CoinMediaPreview from "@/components/coins/CoinMediaPreview";
import WalletIdentityLink from "@/components/WalletIdentityLink";
import {
  getGalleryPublicEnabled,
  listPublicGalleryCoins,
  type GalleryCoin,
} from "data/coins";
import {
  FIXED_BASE_COIN_LABEL,
  getDexscreenerUrl,
  getExplorerAddressUrl,
  getFixedPairAddress,
  getFixedPairConfigError,
} from "@/utils/coining";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";

type CoinGalleryPageProps = {
  coins: GalleryCoin[];
  galleryPublicEnabled: boolean;
};

export const getServerSideProps: GetServerSideProps<
  CoinGalleryPageProps
> = async () => ({
  props: {
    galleryPublicEnabled: await getGalleryPublicEnabled(),
    coins: JSON.parse(JSON.stringify(await listPublicGalleryCoins())),
  },
});

export default function CoinGalleryPage({
  coins,
  galleryPublicEnabled,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const pairConfigError = getFixedPairConfigError();
  const pairAddress = pairConfigError ? "" : getFixedPairAddress();

  return (
    <Layout>
      <Head>
        <title>Gallery | Yellow Collective</title>
      </Head>

      <div className="yc-project-page -m-6 flex w-[calc(100%+3rem)] flex-col gap-7 p-6 pb-12 md:mx-auto md:w-full md:max-w-[1120px] md:p-0 md:pb-12">
        <section className="yc-project-surface flex flex-col items-center justify-between gap-5 rounded-2xl border border-skin-stroke bg-white p-6 text-center text-[#212529] shadow-sm md:flex-row md:items-start md:p-8 md:text-left">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <h1 className="font-heading text-[36px] leading-none md:text-[44px]">
              Gallery
            </h1>
            <p className="max-w-[720px] text-base leading-snug text-[#212529] md:text-lg">
              Content coins created through Yellow Collective. Each coin uses
              the fixed Base pairing configured for this site.
            </p>
          </div>
          <Link
            href="/coins/create"
            className="flex w-fit shrink-0 items-center justify-center rounded-[18px] bg-[#1d9bf0] px-5 py-3 font-heading text-lg text-white shadow-[0px_4.02px_0px_0px_#0f5f99] transition hover:-translate-y-0.5 hover:bg-[#45adf5] hover:shadow-[0px_6px_0px_0px_#0f5f99] active:translate-y-1 active:shadow-none"
          >
            Create coin
          </Link>
        </section>

        {!galleryPublicEnabled ? (
          <div className="yc-project-surface rounded-2xl border border-skin-stroke bg-white p-6 text-[#212529] shadow-sm">
            <div className="font-heading text-2xl leading-tight">
              Gallery is currently disabled
            </div>
            <p className="mt-2 max-w-[720px] text-base leading-snug">
              The content coin Gallery is hidden from public view right now.
            </p>
          </div>
        ) : coins.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {coins.map((coin) => (
              <div
                key={coin.address}
                className="yc-project-surface group overflow-hidden rounded-2xl border border-skin-stroke bg-white text-[#212529] shadow-[0px_4.02px_0px_0px_rgb(var(--color-shadow-accent))] transition hover:-translate-y-0.5 hover:shadow-[0px_6px_0px_0px_rgb(var(--color-shadow-accent))] active:translate-y-1 active:shadow-none"
              >
                <Link href={`/coins/${coin.address}`} className="block">
                  <div className="flex aspect-square w-full items-center justify-center bg-[#fff7bf] text-center font-heading text-2xl">
                    <CoinMediaPreview
                      mediaUrl={coin.mediaUrl}
                      imageUrl={coin.imageUrl}
                      title={coin.title}
                      symbol={coin.symbol}
                      hoverScale
                    />
                  </div>
                </Link>
                <div className="min-h-[86px] border-t border-skin-stroke bg-white p-4">
                  <h2 className="font-heading text-xl leading-tight text-[#212529]">
                    <Link href={`/coins/${coin.address}`} className="underline">
                      {coin.title}{" "}
                    </Link>
                    <span className="text-sm font-semibold">
                      by{" "}
                      <WalletIdentityLink
                        address={coin.ownerAddress}
                        className="underline"
                      />
                    </span>
                  </h2>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="yc-project-surface rounded-2xl border border-skin-stroke bg-white p-6 text-[#212529] shadow-sm">
            <div className="font-heading text-2xl leading-tight">
              No content coins yet
            </div>
            <p className="mt-2 max-w-[720px] text-base leading-snug">
              Use the create flow to publish the first Yellow content coin.
              Created coin links are shown after transaction confirmation.
            </p>
            {pairAddress ? (
              <div className="mt-5 rounded-xl border border-skin-stroke bg-[#fff7bf] p-4">
                <div className="font-heading text-base">
                  Fixed pair: {FIXED_BASE_COIN_LABEL}
                </div>
                <div className="mt-1 break-all font-mono text-xs">
                  {pairAddress}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold underline">
                  <Link
                    href={getExplorerAddressUrl(pairAddress)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Basescan
                  </Link>
                  <Link
                    href={getDexscreenerUrl(pairAddress)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Dexscreener
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-skin-stroke bg-[#fff7bf] p-4 font-semibold">
                {pairConfigError}
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
