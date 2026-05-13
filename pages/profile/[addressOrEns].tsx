import Button from "@/components/Button";
import Layout from "@/components/Layout";
import WalletIdentityLink from "@/components/WalletIdentityLink";
import {
  SubmissionGalleryCard,
  type NoundrySubmission,
} from "@/components/noundry/NoundryPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import {
  areSameWalletAddress,
  createProfileUpdateMessage,
  normalizeProfileMetadata,
  shortenWalletAddress,
  validateProfileMetadata,
} from "@/utils/profile/identity";
import { getEnsAddress } from "data/ens";
import {
  getPublicProfileData,
  type PublicProfileData,
  type ProfileMetadata,
} from "data/profile";
import type { ProfileRoundSubmission, ProfileRoundVote } from "data/rounds";
import type { PlaygroundArtwork } from "data/nouns-builder/artwork";
import type { ProbeToken } from "data/nouns-builder/probe";
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
} from "next";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import useSWR from "swr";
import { useAccount, useSignMessage } from "wagmi";
import { getAddress, isAddress, zeroAddress } from "viem";
import { utils as ethersUtils } from "ethers";

type ProfilePageProps = {
  profile: PublicProfileData | null;
  lookup: string;
  error?: string;
};

const MAINNET_ETHERSCAN_URL = "https://etherscan.io";
const BASESCAN_URL = "https://basescan.org";
type ActivityStatus = "bid" | "submission" | "vote" | "won";
type ProfileFeedItem = {
  id: string;
  href: string;
  title: string;
  meta?: string;
  badge?: string;
  timestamp?: string;
  status: ActivityStatus;
  imageUrl?: string;
  isProposal?: boolean;
  voteTone?: "for" | "against";
};

const toSerializableProfile = (profile: PublicProfileData) =>
  JSON.parse(JSON.stringify(profile)) as PublicProfileData;

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Unable to load data.");
  return data;
};

export const getServerSideProps = async ({
  params,
}: GetServerSidePropsContext): Promise<
  GetServerSidePropsResult<ProfilePageProps>
> => {
  const lookup =
    typeof params?.addressOrEns === "string" ? params.addressOrEns.trim() : "";

  if (!lookup) {
    return {
      props: {
        lookup,
        profile: null,
        error: "Enter a wallet address or ENS name to view a profile.",
      },
    };
  }

  const resolvedAddress = isAddress(lookup)
    ? getAddress(lookup)
    : lookup.toLowerCase().endsWith(".eth")
      ? (await getEnsAddress({ ensName: lookup })).address
      : undefined;

  if (!resolvedAddress) {
    return {
      props: {
        lookup,
        profile: null,
        error: lookup.endsWith(".eth")
          ? "That ENS name did not resolve to a wallet address."
          : "That profile identifier is not a valid wallet address or ENS name.",
      },
    };
  }

  try {
    return {
      props: {
        lookup,
        profile: toSerializableProfile(
          await getPublicProfileData(resolvedAddress)
        ),
      },
    };
  } catch (error) {
    console.error("Unable to load profile", error);
    return {
      props: {
        lookup,
        profile: null,
        error: "Unable to load this profile right now.",
      },
    };
  }
};

export default function ProfilePage({
  profile,
  lookup,
  error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { signMessageAsync, isLoading: isSigning } = useSignMessage();
  const [metadata, setMetadata] = useState<ProfileMetadata | null>(
    profile?.metadata || null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    username: profile?.metadata?.username || "",
    websiteUrl: profile?.metadata?.websiteUrl || "",
    farcaster: profile?.metadata?.farcaster || "",
    twitter: profile?.metadata?.twitter || "",
    avatarUrl: profile?.metadata?.avatarUrl || "",
  });
  const [saveState, setSaveState] = useState<{
    status: "idle" | "saving" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const { data: artwork } = useSWR<PlaygroundArtwork>(
    profile?.noundrySubmissions.length ? "/api/playground/artwork" : null,
    fetcher
  );

  const isOwnProfile = areSameWalletAddress(connectedAddress, profile?.address);
  const stats = useMemo(() => {
    if (!profile) return [];

    return [
      ["Noundry", profile.noundrySubmissions.length],
      ["Round art", profile.roundSubmissions.length],
      ["DAO tokens", profile.ownedTokens.length],
      ["Proposals", profile.submittedProposals.length],
      ["Votes", profile.daoVotes.length + profile.roundVotes.length],
    ] as const;
  }, [profile]);

  const saveProfile = async () => {
    if (!profile || !connectedAddress || !isOwnProfile) return;

    const validationError = validateProfileMetadata(formState);
    if (validationError) {
      setSaveState({ status: "error", message: validationError });
      return;
    }

    setSaveState({ status: "saving", message: "Saving profile..." });

    try {
      const walletMessage = createProfileUpdateMessage(profile.address);
      const walletSignature = await signMessageAsync({ message: walletMessage });
      const response = await fetch(`/api/profile/${profile.address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: connectedAddress,
          walletMessage,
          walletSignature,
          profile: formState,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save profile.");
      }

      setMetadata(result.profile);
      setFormState(normalizeProfileMetadata(result.profile));
      setSaveState({ status: "success", message: "Profile saved." });
      setIsEditing(false);
    } catch (saveError) {
      setSaveState({
        status: "error",
        message:
          saveError instanceof Error
            ? saveError.message
            : "Unable to save profile.",
      });
    }
  };

  if (!profile) {
    return (
      <Layout>
        <Head>
          <title>Profile not found | Yellow Collective</title>
        </Head>
        <div className="mx-auto max-w-[860px] rounded-2xl border border-skin-stroke bg-white p-8 text-center shadow-sm">
          <h1 className="font-heading text-4xl leading-none">Profile not found</h1>
          <p className="mt-3 text-secondary">{error || lookup}</p>
        </div>
      </Layout>
    );
  }

  const displayName =
    metadata?.username || profile.ensName || shortenWalletAddress(profile.address);
  const avatarUrl = metadata?.avatarUrl || profile.ensAvatar || "";
  const externalLinks = [
    metadata?.websiteUrl ? ["Website", metadata.websiteUrl] : undefined,
    metadata?.farcaster ? ["Farcaster", metadata.farcaster] : undefined,
    metadata?.twitter ? ["Twitter/X", metadata.twitter] : undefined,
    ["Etherscan", `${MAINNET_ETHERSCAN_URL}/address/${profile.address}`],
    ["Basescan", `${BASESCAN_URL}/address/${profile.address}`],
  ].filter((link): link is [string, string] => Boolean(link));

  return (
    <Layout>
      <Head>
        <title>{displayName} | Yellow Collective Profile</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 pb-12">
        <section className="overflow-hidden rounded-2xl border border-skin-stroke bg-white shadow-[0px_6px_0px_0px_#BBB]">
          <div className="grid gap-0">
            <div className="flex flex-col gap-6 p-6 md:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ProfileAvatar
                  address={profile.address}
                  avatar={avatarUrl}
                  label={displayName}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h1 className="break-words font-heading text-5xl leading-none">
                        {displayName}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-secondary">
                        {profile.ensName && (
                          <span className="rounded-full bg-[#fff7bf] px-3 py-1 font-heading text-sm text-skin-base">
                            {profile.ensName}
                          </span>
                        )}
                        <WalletIdentityLink
                          address={profile.address}
                          fallback="short"
                          link={false}
                          className="font-heading text-base text-secondary"
                        />
                      </div>
                    </div>
                    {isOwnProfile && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setFormState({
                            username: metadata?.username || "",
                            websiteUrl: metadata?.websiteUrl || "",
                            farcaster: metadata?.farcaster || "",
                            twitter: metadata?.twitter || "",
                            avatarUrl: metadata?.avatarUrl || "",
                          });
                          setSaveState({ status: "idle", message: "" });
                          setIsEditing(true);
                        }}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {externalLinks.map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-skin-stroke bg-skin-muted px-4 py-2 font-heading text-sm text-skin-base transition hover:-translate-y-0.5 hover:bg-[#fff7bf]"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {Object.keys(profile.errors).length > 0 && (
                <div className="rounded-xl border border-[#f3c343] bg-[#fff7bf] p-4 text-sm text-secondary">
                  Some profile sections could not be loaded. The available
                  activity is still shown below.
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 border-t border-skin-stroke bg-[#f7f7f7]">
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  className="border-r border-skin-stroke p-3 last:border-r-0 sm:p-5"
                >
                  <div className="font-heading text-3xl leading-none text-skin-base sm:text-4xl">
                    {value}
                  </div>
                  <div className="mt-1 text-[11px] leading-tight text-secondary sm:text-sm">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <GalleryTab
          artwork={artwork}
          submissions={profile.noundrySubmissions}
        />
        <DaoActivityFeed
          proposals={profile.submittedProposals}
          votes={profile.daoVotes}
          auctionBids={profile.auctionBids}
          auctionWins={profile.auctionWins}
        />
        <RoundsActivityFeed
          submissions={profile.roundSubmissions}
          votes={profile.roundVotes}
        />
        <OwnedTokensSection tokens={profile.ownedTokens} />
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] max-w-[620px] overflow-y-auto bg-white p-0">
          <DialogHeader className="border-b border-skin-stroke p-6 pr-16">
            <DialogTitle className="font-heading text-3xl leading-none">
              Edit profile
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-6">
            <ProfileAvatarUpload
              address={profile.address}
              value={formState.avatarUrl}
              fallbackAvatar={profile.ensAvatar}
              label={displayName}
              onChange={(avatarUrl) =>
                setFormState((current) => ({ ...current, avatarUrl }))
              }
              onError={(message) =>
                setSaveState({ status: "error", message })
              }
            />
            <ProfileField
              label="Username"
              value={formState.username}
              onChange={(value) =>
                setFormState((current) => ({ ...current, username: value }))
              }
              placeholder="yellowartist"
            />
            <ProfileField
              label="Website"
              value={formState.websiteUrl}
              onChange={(value) =>
                setFormState((current) => ({ ...current, websiteUrl: value }))
              }
              placeholder="https://your-site.xyz"
            />
            <ProfileField
              label="Farcaster"
              value={formState.farcaster}
              onChange={(value) =>
                setFormState((current) => ({ ...current, farcaster: value }))
              }
              placeholder="@handle or Warpcast URL"
            />
            <ProfileField
              label="Twitter/X"
              value={formState.twitter}
              onChange={(value) =>
                setFormState((current) => ({ ...current, twitter: value }))
              }
              placeholder="@handle or X URL"
            />
            {saveState.message && (
              <p
                className={`rounded-xl border p-3 text-sm ${
                  saveState.status === "error"
                    ? "border-[#c93d2f] bg-[#fff1ef] text-[#c93d2f]"
                    : "border-skin-stroke bg-skin-muted text-secondary"
                }`}
              >
                {saveState.message}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveProfile}
                disabled={
                  !isConnected || !isOwnProfile || isSigning || saveState.status === "saving"
                }
              >
                {isSigning || saveState.status === "saving" ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

const ProfileAvatar = ({
  address,
  avatar,
  label,
}: {
  address: string;
  avatar?: string;
  label: string;
}) => (
  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-skin-stroke bg-[#ffcc00] shadow-[0px_5px_0px_0px_#b89400]">
    {avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt={label} className="h-full w-full object-cover" />
    ) : (
      <Jazzicon diameter={86} seed={jsNumberForAddress(address || zeroAddress)} />
    )}
  </div>
);

const resizeAvatarFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 5MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = document.createElement("img");
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 320;
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const left = (size - width) / 2;
        const top = (size - height) / 2;

        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process image."));
          return;
        }

        context.fillStyle = "#ffcc00";
        context.fillRect(0, 0, size, size);
        context.drawImage(image, left, top, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = () => reject(new Error("Unable to read image."));
      image.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });

const ProfileAvatarUpload = ({
  address,
  value,
  fallbackAvatar,
  label,
  onChange,
  onError,
}: {
  address: string;
  value: string;
  fallbackAvatar?: string;
  label: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
}) => {
  const previewAvatar = value || fallbackAvatar || "";

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      onChange(await resizeAvatarFile(file));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ProfileAvatar address={address} avatar={previewAvatar} label={label} />
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <div className="font-heading text-lg leading-none">
              Profile picture
            </div>
            <p className="mt-1 text-sm text-secondary">
              Uses your ENS photo by default. Uploading here overrides it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex w-fit cursor-pointer items-center justify-center rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] active:translate-y-1 active:shadow-none">
              Upload image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] active:translate-y-1 active:shadow-none"
              >
                Use ENS default
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GalleryTab = ({
  artwork,
  submissions,
}: {
  artwork?: PlaygroundArtwork;
  submissions: NoundrySubmission[];
}) => (
  <ProfileSection
    title="Noundry Gallery"
    emptyTitle="No gallery submissions yet"
    emptyBody="When this wallet submits traits to the Noundry Gallery, they will appear here."
    isEmpty={submissions.length === 0}
  >
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
      {submissions.map((submission) => (
        <SubmissionGalleryCard
          key={submission.id}
          submission={submission}
          artwork={artwork}
          compact
        />
      ))}
    </div>
  </ProfileSection>
);

const RoundsActivityFeed = ({
  submissions,
  votes,
}: {
  submissions: ProfileRoundSubmission[];
  votes: ProfileRoundVote[];
}) => {
  const activity: ProfileFeedItem[] = [
    ...submissions.map((submission) => ({
      id: `round-submission-${submission.id}`,
      href: `/rounds/${submission.roundSlug}`,
      title: submission.title,
      meta: `Submitted to ${submission.roundTitle}`,
      badge: `${submission.voteCount} votes`,
      status: "submission" as const,
      timestamp: submission.createdAt,
    })),
    ...votes.map((vote) => ({
      id: `round-vote-${vote.id}`,
      href: `/rounds/${vote.roundSlug}`,
      title: vote.submissionTitle,
      meta: `Voted in ${vote.roundTitle}`,
      badge: `${vote.voteCount} votes`,
      status: "vote" as const,
      timestamp: vote.updatedAt || vote.createdAt,
    })),
  ].sort(sortNewestActivity);

  return (
    <ProfileSection
      title="Rounds activity"
      emptyTitle="No rounds activity yet"
      emptyBody="Round submissions and votes from this wallet will appear here."
      isEmpty={activity.length === 0}
    >
      <ActivityFeedList>
        {activity.map((item) => (
          <ProfileListLink
            key={item.id}
            href={item.href}
            title={item.title}
            meta={item.meta}
            badge={item.badge}
            status={item.status}
          />
        ))}
      </ActivityFeedList>
    </ProfileSection>
  );
};

const OwnedTokensSection = ({
  tokens,
}: {
  tokens: ProbeToken[];
}) => (
  <ProfileSection
    title="Owned Collective Nouns"
    emptyTitle="No DAO tokens owned"
    emptyBody="Collective Nouns owned by this wallet will appear here."
    isEmpty={tokens.length === 0}
  >
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
      {tokens.map((token) => (
        <Link
          key={token.id}
          href={`/?tokenid=${token.id}`}
          className="overflow-hidden rounded-xl border border-skin-stroke bg-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff7bf]"
        >
          {token.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.image} alt={token.name} className="aspect-square w-full bg-[#ffcc00] object-cover" />
          ) : (
            <div className="aspect-square bg-[#ffcc00]" />
          )}
          <div className="p-2 font-heading text-sm leading-tight sm:p-3">
            {token.name}
          </div>
        </Link>
      ))}
    </div>
  </ProfileSection>
);

const DaoActivityFeed = ({
  proposals,
  votes,
  auctionBids,
  auctionWins,
}: {
  proposals: PublicProfileData["submittedProposals"];
  votes: PublicProfileData["daoVotes"];
  auctionBids: PublicProfileData["auctionBids"];
  auctionWins: PublicProfileData["auctionWins"];
}) => {
  const activity: ProfileFeedItem[] = [
    ...proposals.map((proposal) => ({
      id: `proposal-${proposal.proposalId}`,
      href: `/proposals/${proposal.proposalId}`,
      title: `Proposal: ${proposal.title}`,
      meta: "Proposal submitted",
      badge: `State ${proposal.state}`,
      status: "submission" as const,
      isProposal: true,
      timestamp: proposal.timeCreated
        ? new Date(proposal.timeCreated * 1000).toISOString()
        : undefined,
    })),
    ...votes.map((vote) => ({
      voteTone: getVoteTone(vote.support),
      id: `proposal-vote-${vote.proposalId}-${vote.support}`,
      href: `/proposals/${vote.proposalId}`,
      title: `Proposal: ${vote.proposalTitle}`,
      meta: `Voted ${supportText(vote.support)}`,
      badge: `${vote.weight} votes`,
      status: getVoteStatus(vote.support),
      isProposal: true,
      timestamp: undefined,
    })),
    ...auctionBids.map((bid) => ({
      id: bid.id,
      href: `/?tokenid=${bid.tokenId}`,
      title: bid.tokenName,
      meta: "Bid placed",
      badge: formatEthAmount(bid.amount),
      status: "bid" as const,
      imageUrl: bid.tokenImage,
      timestamp: bid.createdAt,
    })),
    ...auctionWins.map((win) => ({
      id: win.id,
      href: `/?tokenid=${win.tokenId}`,
      title: win.tokenName,
      meta: "Auction won",
      badge: formatEthAmount(win.amount),
      status: "won" as const,
      imageUrl: win.tokenImage,
      timestamp: win.createdAt,
    })),
  ].sort(sortNewestActivity);

  return (
    <ProfileSection
      title="DAO activity"
      emptyTitle="No DAO activity found"
      emptyBody="Proposal submissions, proposal votes, auction bids, and auction wins will appear here."
      isEmpty={activity.length === 0}
    >
      <ActivityFeedList>
        {activity.map((item) => (
          <ProfileListLink
            key={item.id}
            href={item.href}
            title={item.title}
            meta={item.meta}
            badge={item.badge}
            imageUrl={item.imageUrl}
            status={item.status}
            isProposal={item.isProposal}
            voteTone={item.voteTone}
          />
        ))}
      </ActivityFeedList>
    </ProfileSection>
  );
};

const ActivityFeedList = ({ children }: { children: React.ReactNode }) => (
  <div className="max-h-[500px] overflow-y-auto pr-2">
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const ProfileSection = ({
  title,
  emptyTitle,
  emptyBody,
  isEmpty,
  children,
}: {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm md:p-6">
    <h2 className="font-heading text-3xl leading-none">{title}</h2>
    <div className="mt-5">
      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-skin-stroke bg-skin-muted p-8 text-center">
          <h3 className="font-heading text-2xl leading-none">{emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-[520px] text-secondary">{emptyBody}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </section>
);

const ProfileListLink = ({
  href,
  title,
  meta,
  badge,
  imageUrl,
  status,
  isProposal = false,
  voteTone,
}: {
  href: string;
  title: string;
  meta?: string;
  badge?: string;
  imageUrl?: string;
  status: ActivityStatus;
  isProposal?: boolean;
  voteTone?: "for" | "against";
}) => (
  <Link
    href={href}
    className={`flex min-h-[76px] flex-col gap-3 rounded-2xl border bg-skin-muted p-3 transition hover:-translate-y-0.5 hover:bg-[#fff7bf] sm:flex-row sm:items-center sm:justify-between sm:p-4 ${getActivityBorderClass(voteTone)}`}
  >
    <div className="flex min-w-0 items-center gap-3">
      <ActivityStatusButton status={status} voteTone={voteTone} />
      {imageUrl && (
        <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-skin-stroke bg-[#ffcc00]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2 break-words font-heading text-xl leading-none text-skin-base">
          <span>{title}</span>
          {isProposal && (
            <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 text-secondary" />
          )}
        </div>
        {meta && <div className="mt-1 text-sm text-secondary">{meta}</div>}
      </div>
    </div>
    {badge && (
      <span className="w-fit shrink-0 rounded-full bg-white px-3 py-1 font-heading text-sm text-skin-base">
        {badge}
      </span>
    )}
  </Link>
);

const ActivityStatusButton = ({
  status,
  voteTone,
}: {
  status: ActivityStatus;
  voteTone?: "for" | "against";
}) => {
  const statusConfig = {
    bid: {
      label: "Bid",
      className:
        "bg-[#1d9bf0] text-white shadow-[0px_4px_0px_0px_#0f5f99]",
      Icon: CurrencyDollarIcon,
    },
    submission: {
      label: "Submitted",
      className: "bg-[#fff7bf] shadow-[0px_4px_0px_0px_#d8b414]",
      Icon: DocumentTextIcon,
    },
    vote: {
      label: voteTone === "against" ? "Against" : "For",
      className:
        voteTone === "against"
          ? "bg-skin-proposal-danger text-white shadow-[0px_4px_0px_0px_#a52824]"
          : "bg-skin-proposal-success text-white shadow-[0px_4px_0px_0px_#0d8f49]",
      Icon: voteTone === "against" ? XMarkIcon : CheckCircleIcon,
    },
    won: {
      label: "Won",
      className:
        "bg-skin-proposal-success text-white shadow-[0px_4px_0px_0px_#0d8f49]",
      Icon: TrophyIcon,
    },
  }[status];
  const Icon = statusConfig.Icon;

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-skin-stroke text-skin-base ${statusConfig.className}`}
      aria-label={statusConfig.label}
      title={statusConfig.label}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
};

const ProfileField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <label className="flex flex-col gap-2">
    <span className="font-heading text-lg leading-none">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-2xl border border-skin-stroke bg-skin-muted px-4 py-3 text-base outline-none transition focus:border-skin-base focus:bg-white"
    />
  </label>
);

const supportText = (support: number) => {
  if (support === 0) return "Against";
  if (support === 1) return "For";
  return "Abstain";
};

const getVoteTone = (support: number) => {
  if (support === 0) return "against" as const;
  if (support === 1) return "for" as const;
  return undefined;
};

const getVoteStatus = (_support: number): ActivityStatus => "vote";

const getActivityBorderClass = (voteTone?: "for" | "against") => {
  if (voteTone === "against") return "border-skin-proposal-danger";
  if (voteTone === "for") return "border-skin-proposal-success";
  return "border-skin-stroke";
};

const getActivityTime = (timestamp?: string) =>
  timestamp ? new Date(timestamp).getTime() || 0 : 0;

const sortNewestActivity = <T extends { timestamp?: string }>(
  first: T,
  second: T
) => getActivityTime(second.timestamp) - getActivityTime(first.timestamp);

const formatEthAmount = (value: string) => {
  try {
    const formatted = Number(ethersUtils.formatEther(value || "0"));
    if (!Number.isFinite(formatted)) return "0 ETH";

    return `${formatted.toLocaleString("en-US", {
      maximumFractionDigits: 3,
    })} ETH`;
  } catch {
    return "0 ETH";
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
