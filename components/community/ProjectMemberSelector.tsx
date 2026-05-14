import {
  areSameWalletAddress,
  normalizeWalletAddress,
  shortenWalletAddress,
} from "@/utils/profile/identity";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { DaoMemberSummary } from "data/members";
import { useMemo, useState } from "react";

type ProjectMemberSelectorProps = {
  members: DaoMemberSummary[];
  selectedAddresses: string[];
  onChange: (addresses: string[]) => void;
  isLoading?: boolean;
  error?: string;
};

const memberLabel = (member: DaoMemberSummary) =>
  member.displayName ||
  member.ensName ||
  member.username ||
  shortenWalletAddress(member.address);

const memberSearchText = (member: DaoMemberSummary) =>
  [
    member.displayName,
    member.ensName,
    member.username,
    member.address,
    member.firstTokenName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export default function ProjectMemberSelector({
  members,
  selectedAddresses,
  onChange,
  isLoading = false,
  error,
}: ProjectMemberSelectorProps) {
  const [query, setQuery] = useState("");
  const normalizedSelected = useMemo(
    () =>
      selectedAddresses.reduce<string[]>((addresses, address) => {
        const normalizedAddress = normalizeWalletAddress(address);
        return normalizedAddress ? [...addresses, normalizedAddress] : addresses;
      }, []),
    [selectedAddresses]
  );
  const selectedMembers = useMemo(
    () =>
      normalizedSelected.map((address) => {
        const member = members.find((item) =>
          areSameWalletAddress(item.address, address)
        );

        return {
          address,
          label: member ? memberLabel(member) : shortenWalletAddress(address),
          imageUrl: member?.avatarUrl || member?.firstTokenImage || "",
        };
      }),
    [members, normalizedSelected]
  );
  const selectedKeys = useMemo(
    () => new Set(normalizedSelected.map((address) => address.toLowerCase())),
    [normalizedSelected]
  );
  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const availableMembers = members.filter(
      (member) => !selectedKeys.has(member.address.toLowerCase())
    );

    if (!normalizedQuery) return availableMembers.slice(0, 8);

    return availableMembers
      .filter((member) => memberSearchText(member).includes(normalizedQuery))
      .slice(0, 8);
  }, [members, query, selectedKeys]);

  const addMember = (address: string) => {
    const normalizedAddress = normalizeWalletAddress(address);
    if (!normalizedAddress || selectedKeys.has(normalizedAddress.toLowerCase())) {
      return;
    }

    onChange([...normalizedSelected, normalizedAddress]);
    setQuery("");
  };

  const removeMember = (address: string) => {
    onChange(
      normalizedSelected.filter(
        (selectedAddress) => !areSameWalletAddress(selectedAddress, address)
      )
    );
  };

  return (
    <div>
      <label className="block font-heading text-base text-skin-base">
        Project members
      </label>
      <div className="mt-2 rounded-xl border border-skin-stroke bg-skin-muted p-3">
        {selectedMembers.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <span
                key={member.address}
                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-skin-stroke bg-white px-2.5 py-2 shadow-[0px_2px_0px_0px_#BBB]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#ffcc00] font-heading text-xs text-skin-base">
                  {member.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "YC"
                  )}
                </span>
                <span className="min-w-0 truncate font-heading text-sm text-skin-base">
                  {member.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeMember(member.address)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-skin-muted text-secondary transition hover:bg-[#fff7bf] hover:text-skin-base"
                  aria-label={`Remove ${member.label}`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            isLoading ? "Loading members..." : "Search members by ENS or wallet"
          }
          disabled={isLoading}
          className="w-full rounded-xl border border-skin-stroke bg-white px-4 py-3 text-base text-skin-base placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-skin-highlighted disabled:cursor-wait disabled:opacity-70"
        />

        {error && <p className="mt-2 text-sm text-skin-proposal-danger">{error}</p>}

        {!isLoading && filteredMembers.length > 0 && (
          <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-skin-stroke bg-white shadow-sm">
            {filteredMembers.map((member) => (
              <button
                key={member.address}
                type="button"
                onClick={() => addMember(member.address)}
                className="flex w-full items-center gap-3 border-b border-skin-stroke px-3 py-2.5 text-left last:border-b-0 hover:bg-[#fff7bf]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ffcc00] font-heading text-xs text-skin-base">
                  {member.avatarUrl || member.firstTokenImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl || member.firstTokenImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "YC"
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-heading text-base leading-none text-skin-base">
                    {memberLabel(member)}
                  </span>
                  <span className="mt-1 block truncate text-xs text-secondary">
                    {member.address}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {!isLoading && query.trim() && filteredMembers.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-skin-stroke bg-white p-3 text-sm text-secondary">
            No matching members found.
          </p>
        )}
      </div>
    </div>
  );
}
