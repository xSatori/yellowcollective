import { compareAddress } from "./compareAddress";

export const ADMIN_WALLET_ADDRESSES = [
  "0xdcf37d8Aa17142f053AAA7dc56025aB00D897a19",
  "0x70abdCd7A5A8Ff9cDef1ccA9eA15a5d315780986",
] as const;

export const ADMIN_WALLET_ADDRESS = ADMIN_WALLET_ADDRESSES[0];

export const isAdminAddress = (address?: string | null) =>
  Boolean(
    address &&
      ADMIN_WALLET_ADDRESSES.some((adminAddress) =>
        compareAddress(address, adminAddress)
      )
  );
