import { NextApiRequest, NextApiResponse } from "next";
import { getEnsNamesForAddresses } from "data/ens";
import { getAddress, isAddress } from "viem";
import { applyRateLimit } from "@/utils/rate-limit";

export type GetEnsNamesReturnType = {
  names: Record<string, string>;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (
    !applyRateLimit(req, res, {
      keyPrefix: "ens-names",
      limit: 30,
      windowMs: 60 * 1000,
    })
  ) {
    return;
  }

  const rawAddresses: unknown[] = Array.isArray(req.body?.addresses)
    ? req.body.addresses
    : [];
  const addresses = Array.from(
    new Set(
      rawAddresses
        .filter(
          (address): address is string =>
            typeof address === "string" && isAddress(address)
        )
        .map((address) => getAddress(address))
    )
  ).slice(0, 1000);

  const names = await getEnsNamesForAddresses(addresses);

  const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
  res.setHeader(
    "Cache-Control",
    `s-maxage=${ONE_DAY_IN_SECONDS}, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`
  );
  res.status(200).json({ names });
};

export default handler;
