import Header from "../components/Header";
import { useIsMounted } from "hooks/useIsMounted";
import { Fragment } from "react";
import Hero from "../components/Hero/Hero";
import { GetStaticPropsResult, InferGetStaticPropsType } from "next";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { SWRConfig } from "swr";
import {
  ContractInfo,
  getContractInfo,
  getTokenInfo,
  TokenInfo,
} from "data/nouns-builder/token";
import { AuctionInfo, getCurrentAuction } from "data/nouns-builder/auction";
import Footer from "@/components/Footer";
import { getAddresses } from "@/services/nouns-builder/manager";
import Banner from "@/components/Banner";
import Faq from "@/components/Faq";
import Description from "@/components/Description";
import { TOKEN_CONTRACT } from "constants/addresses";

export const getStaticProps = async (): Promise<
  GetStaticPropsResult<{
    tokenContract: string;
    tokenId: string;
    contract: ContractInfo;
    token: TokenInfo;
    auction: AuctionInfo;
  }>
> => {
  // Get token and auction info
  const tokenContract = TOKEN_CONTRACT as `0x${string}`;

  const [addresses, contract] = await Promise.all([
    getAddresses({ tokenAddress: tokenContract }),
    getContractInfo({ address: tokenContract }),
  ]);

  const auction = await getCurrentAuction({ address: addresses.auction });
  const tokenId = auction.tokenId;
  const token = await getTokenInfo({
    address: tokenContract,
    tokenid: tokenId,
  });

  if (!contract.image) contract.image = "";

  return {
    props: {
      tokenContract,
      tokenId,
      contract,
      token,
      auction,
    },
    revalidate: 60,
  };
};

export default function SiteComponent({
  tokenContract,
  tokenId,
  contract,
  token,
  auction,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const isMounted = useIsMounted();

  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/token/${tokenContract}`]: contract,
          [`/api/token/${tokenContract}/${tokenId}`]: token,
          [`/api/auction/${contract.auction}`]: auction,
        },
      }}
    >
      {isMounted && (
        <div className="bg-accent flex min-h-dvh w-full flex-col items-center justify-start">
          <Banner />
          <div className="max-w-[1400px] w-full">
            <Header />
          </div>
          <Hero />
          <Description />
          <Faq />
          <Footer />
        </div>
      )}
    </SWRConfig>
  );
}
