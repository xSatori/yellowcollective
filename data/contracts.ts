import { ETHERSCAN_BASEURL } from "constants/urls";

export type ContractCategory =
  | "NFT"
  | "Auction"
  | "Governance"
  | "Treasury"
  | "Metadata";

export type DaoContract = {
  name: string;
  category: ContractCategory;
  address: `0x${string}`;
  description: string;
};

export const YELLOW_COLLECTIVE_CONTRACTS = {
  nft: {
    name: "Collective Nouns NFT",
    category: "NFT",
    address: "0x220e41499cf4d93a3629a5509410cbf9e6e0b109",
    description:
      "ERC-721 membership and artwork contract for Collective Nouns.",
  },
  auctionHouse: {
    name: "Auction House",
    category: "Auction",
    address: "0x0aa23a7e112889c965010558803813710becf263",
    description:
      "Runs the daily Collective Noun auction and routes proceeds to the DAO.",
  },
  governor: {
    name: "Governor",
    category: "Governance",
    address: "0x1297ffd714acb55af447c6b7641b3cf01930d605",
    description:
      "Onchain governance contract for proposal creation, voting, and execution.",
  },
  treasury: {
    name: "Treasury",
    category: "Treasury",
    address: "0x55333306a4c6e74eb9e23a521a24fb78be2de92c",
    description:
      "DAO treasury that holds auction proceeds and assets allocated by governance.",
  },
  metadata: {
    name: "Metadata",
    category: "Metadata",
    address: "0x10907e788ad02a81bef81e4ae560664ced3b0818",
    description:
      "Renderer and metadata contract for Collective Nouns token artwork.",
  },
} satisfies Record<string, DaoContract>;

export const YELLOW_COLLECTIVE_CONTRACT_LIST = Object.values(
  YELLOW_COLLECTIVE_CONTRACTS
);

export const getExplorerAddressUrl = (address: string) =>
  `${ETHERSCAN_BASEURL}/address/${address}`;
