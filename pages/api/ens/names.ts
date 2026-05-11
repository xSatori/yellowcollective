import { NextApiRequest, NextApiResponse } from "next";
import { getEnsName } from "data/ens";
import { getAddress, isAddress } from "viem";

export type GetEnsNamesReturnType = {
  names: Record<string, string>;
};

const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size)
  );

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
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

  const names: Record<string, string> = {};

  for (const addressBatch of chunk(addresses, 25)) {
    const results = await Promise.allSettled(
      addressBatch.map(async (address) => {
        const { ensName } = await getEnsName({ address });
        return [address.toLowerCase(), ensName || ""] as const;
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value[1]) {
        names[result.value[0]] = result.value[1];
      }
    });
  }

  const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
  res.setHeader(
    "Cache-Control",
    `s-maxage=${ONE_DAY_IN_SECONDS}, stale-while-revalidate=${ONE_DAY_IN_SECONDS}`
  );
  res.status(200).json({ names });
};

export default handler;
