import Layout from "@/components/Layout";
import WalletIdentityLink from "@/components/WalletIdentityLink";
import { getProfilePath } from "@/utils/profile/identity";
import type {
  ProbeToken,
  ProbeTokenResponse,
  ProbeTraitOption,
} from "data/nouns-builder/probe";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type SortMode = "newest" | "oldest" | "name";

const traitOrder = ["accessories", "backgrounds", "bodies", "heads"];
const burnerOwners = new Set([
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead",
]);

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load Collective Nouns.");
  }

  return data;
};

export default function ProbePage() {
  const { data, error, isLoading } = useSWR<ProbeTokenResponse>(
    "/api/probe/tokens",
    fetcher
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedOwner, setSelectedOwner] = useState("");
  const [ensNames, setEnsNames] = useState<Record<string, string>>({});
  const [attemptedEns, setAttemptedEns] = useState<Record<string, boolean>>({});
  const [selectedToken, setSelectedToken] = useState<ProbeToken | null>(null);
  const visibleTraitOptions = useMemo(() => {
    const options = (data?.traitOptions || []).filter(
      (option) => option.trait.toLowerCase() !== "glasses"
    );

    return options.sort((a, b) => {
      const aIndex = traitOrder.indexOf(a.trait.toLowerCase());
      const bIndex = traitOrder.indexOf(b.trait.toLowerCase());

      return (
        (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex) ||
        a.trait.localeCompare(b.trait)
      );
    });
  }, [data?.traitOptions]);
  const ownerOptions = useMemo(() => {
    const owners = Array.from(
      new Set(
        (data?.tokens || [])
          .map((token) => token.owner?.toLowerCase())
          .filter(
            (owner): owner is string =>
              typeof owner === "string" && !burnerOwners.has(owner)
          )
      )
    );

    return owners
      .map((owner) => ({
        address: owner,
        hasEnsName: Boolean(ensNames[owner]),
        label: ensNames[owner] || owner,
      }))
      .sort((a, b) => {
        if (a.hasEnsName !== b.hasEnsName) {
          return a.hasEnsName ? -1 : 1;
        }

        return a.label.localeCompare(b.label);
      });
  }, [data?.tokens, ensNames]);

  useEffect(() => {
    const owners = ownerOptions
      .map((owner) => owner.address)
      .filter((owner) => !ensNames[owner] && !attemptedEns[owner]);

    if (owners.length === 0) return;

    let isActive = true;

    const resolveOwners = async () => {
      try {
        const response = await fetch("/api/ens/names", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: owners }),
        });
        const data = await response.json();

        if (!isActive) return;

        if (response.ok && data.names) {
          setEnsNames((currentNames) => ({
            ...currentNames,
            ...data.names,
          }));
        }
      } catch (error) {
        console.error("Unable to resolve owner ENS names", error);
      } finally {
        if (isActive) {
          setAttemptedEns((currentAttempts) => ({
            ...currentAttempts,
            ...Object.fromEntries(owners.map((owner) => [owner, true])),
          }));
        }
      }
    };

    resolveOwners();

    return () => {
      isActive = false;
    };
  }, [attemptedEns, ensNames, ownerOptions]);

  const filteredTokens = useMemo(() => {
    const tokens = [...(data?.tokens || [])];
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = tokens.filter((token) => {
      const matchesQuery =
        !normalizedQuery ||
        token.name.toLowerCase().includes(normalizedQuery) ||
        String(token.id).includes(normalizedQuery) ||
        token.owner?.toLowerCase().includes(normalizedQuery) ||
        (token.owner && ensNames[token.owner.toLowerCase()]
          ?.toLowerCase()
          .includes(normalizedQuery)) ||
        Object.values(token.attributes).some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      const matchesTraits = Object.entries(filters).every(
        ([trait, value]) => !value || token.attributes[trait] === value
      );

      const matchesOwner =
        !selectedOwner || token.owner?.toLowerCase() === selectedOwner;

      return matchesQuery && matchesTraits && matchesOwner;
    });

    return filtered.sort((a, b) => {
      if (sort === "oldest") return a.id - b.id;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.id - a.id;
    });
  }, [data?.tokens, ensNames, filters, query, selectedOwner, sort]);

  const updateFilter = (trait: string, value: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [trait]: value,
    }));
  };

  const resetFilters = () => {
    setQuery("");
    setFilters({});
    setSelectedOwner("");
    setSort("newest");
  };

  return (
    <Layout>
      <Head>
        <title>Probe | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 pb-12">
        <section className="yc-dark-yellow-surface grid gap-5 rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8 lg:grid-cols-[1fr_320px]">
          <div>
            <h1 className="font-heading text-[42px] leading-none text-skin-base md:text-[58px]">
              Probe
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-snug text-[#212529] md:text-lg">
              Explore every minted Collective Noun by token ID, owner, and
              metadata traits.
            </p>
          </div>
          <div className="grid grid-cols-2 place-items-center gap-3 rounded-xl border border-skin-stroke bg-skin-muted p-4 text-center">
            <Metric label="Minted" value={data?.tokens.length || 0} />
            <Metric label="Supply" value={data?.totalSupply || 0} />
          </div>
        </section>

        <section className="yc-dark-yellow-surface rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_140px]">
            <label className="block">
              <span className="font-heading text-base text-skin-base">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Token ID, trait, or name"
                className="mt-2 w-full rounded-xl border border-skin-stroke bg-skin-muted px-4 py-3 text-base text-skin-base placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-skin-highlighted"
              />
            </label>
            <label className="block">
              <span className="font-heading text-base text-skin-base">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="mt-2 w-full rounded-xl border border-skin-stroke bg-skin-muted px-4 py-3 text-base text-skin-base focus:outline-none focus:ring-2 focus:ring-skin-highlighted"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
            </label>
            <button
              type="button"
              onClick={resetFilters}
              className="yc-dark-force-white self-end rounded-[18px] border border-skin-stroke bg-accent px-4 py-3 font-heading text-base text-skin-base shadow-[0px_4.02px_0px_0px_rgb(var(--color-shadow-accent))] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] active:translate-y-1 active:shadow-none"
            >
              Reset
            </button>
          </div>

          {data && visibleTraitOptions.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {visibleTraitOptions.map((option) => (
                <TraitFilter
                  key={option.trait}
                  option={option}
                  value={filters[option.trait] || ""}
                  onChange={(value) => updateFilter(option.trait, value)}
                />
              ))}
              <OwnerFilter
                owners={ownerOptions}
                value={selectedOwner}
                onChange={setSelectedOwner}
              />
            </div>
          )}
        </section>

        {isLoading && (
          <section className="yc-dark-yellow-surface rounded-2xl border border-skin-stroke bg-white p-6 text-secondary shadow-sm">
            Loading Collective Nouns...
          </section>
        )}

        {error && (
          <section className="yc-dark-yellow-surface rounded-2xl border border-skin-stroke bg-white p-6 text-skin-proposal-danger shadow-sm">
            {error.message}
          </section>
        )}

        {data && filteredTokens.length === 0 && (
          <section className="yc-dark-yellow-surface rounded-2xl border border-dashed border-skin-stroke bg-white p-8 text-center text-secondary">
            No Collective Nouns match these filters.
          </section>
        )}

        {filteredTokens.length > 0 && (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {filteredTokens.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => setSelectedToken(token)}
                className="yc-dark-yellow-surface group relative overflow-hidden rounded-2xl border border-skin-stroke bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <TokenImage token={token} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-white/90 p-3 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="font-heading text-lg leading-tight text-skin-base">
                    #{token.id}
                  </div>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>

      {selectedToken && (
        <TokenModal
          token={selectedToken}
          ensNames={ensNames}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </Layout>
  );
}

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="font-heading text-3xl leading-none text-skin-base">
      {value}
    </div>
    <div className="mt-1 text-sm leading-tight text-secondary">{label}</div>
  </div>
);

const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const TraitFilter = ({
  option,
  value,
  onChange,
}: {
  option: ProbeTraitOption;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="font-heading text-sm capitalize text-skin-base">
      {option.trait}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-xl border border-skin-stroke bg-skin-muted px-3 py-2 text-sm text-skin-base focus:outline-none focus:ring-2 focus:ring-skin-highlighted"
    >
      <option value="">Any</option>
      {option.values.map((traitValue) => (
        <option key={traitValue} value={traitValue}>
          {traitValue}
        </option>
      ))}
    </select>
  </label>
);

const OwnerFilter = ({
  owners,
  value,
  onChange,
}: {
  owners: { address: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="font-heading text-sm text-skin-base">Owner</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-xl border border-skin-stroke bg-skin-muted px-3 py-2 text-sm text-skin-base focus:outline-none focus:ring-2 focus:ring-skin-highlighted"
    >
      <option value="">Any</option>
      {owners.map((owner) => (
        <option key={owner.address} value={owner.address}>
          {owner.label}
        </option>
      ))}
    </select>
  </label>
);

const TokenImage = ({ token }: { token: ProbeToken }) => (
  <div className="aspect-square bg-[#ffcc00]">
    {token.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={token.image}
        alt={token.name}
        className="h-full w-full object-contain"
      />
    ) : (
      <div className="flex h-full items-center justify-center text-center font-heading text-xl text-skin-base">
        #{token.id}
      </div>
    )}
  </div>
);

const TokenModal = ({
  token,
  ensNames,
  onClose,
}: {
  token: ProbeToken;
  ensNames: Record<string, string>;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    onClick={onClose}
    role="presentation"
  >
    <div
      className="yc-dark-yellow-surface grid w-full max-w-4xl gap-5 rounded-2xl border border-skin-stroke bg-white p-5 shadow-xl md:grid-cols-[360px_1fr]"
      onClick={(event) => event.stopPropagation()}
    >
      <TokenImage token={token} />
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-[38px] leading-none text-skin-base">
              #{token.id}
            </h2>
            <p className="mt-2 text-base leading-snug text-secondary">
              {token.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-skin-stroke px-3 py-1 font-heading text-base text-skin-base transition hover:bg-[#fff7bf]"
          >
            Close
          </button>
        </div>

        {token.owner && (
          <Link
            href={getProfilePath({
              address: token.owner,
              ensName: ensNames[token.owner.toLowerCase()],
            })}
            className="mt-5 block rounded-xl border border-skin-stroke bg-skin-muted p-3 text-sm text-secondary transition hover:bg-[#fff7bf]"
          >
            Owner{" "}
            <WalletIdentityLink
              address={token.owner}
              ensName={ensNames[token.owner.toLowerCase()]}
              fallback="full"
              link={false}
            />
          </Link>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(token.attributes).map(([trait, value]) => (
            <div
              key={trait}
              className="rounded-xl border border-skin-stroke bg-skin-muted p-3"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {trait}
              </div>
              <div className="mt-1 font-heading text-lg leading-tight text-skin-base">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
