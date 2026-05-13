import Layout from "@/components/Layout";
import WalletIdentityLink from "@/components/WalletIdentityLink";
import useEnsName from "@/hooks/fetch/useEnsName";
import {
  NoundrySubmission,
  SubmissionGalleryCard,
  formatRelativeTime,
  getLayerLabel,
  shortenAddress,
} from "@/components/noundry/NoundryPreview";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import type { PlaygroundArtwork } from "data/nouns-builder/artwork";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import useSWR from "swr";
import type { Address } from "viem";
import { getAddress, isAddress } from "viem";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load Noundry data.");
  }

  return data;
};

export default function NoundryArtistPage() {
  const router = useRouter();
  const artist =
    typeof router.query.artist === "string" ? router.query.artist : "";
  const normalizedArtist = isAddress(artist) ? getAddress(artist) : undefined;
  const { data: artistEnsName } = useEnsName(normalizedArtist as Address);
  const artistDisplayName =
    artistEnsName?.ensName || (artist ? shortenAddress(artist) : "");
  const { data: artwork, error: artworkError } = useSWR<PlaygroundArtwork>(
    "/api/playground/artwork",
    fetcher
  );
  const { data, error: submissionsError } = useSWR<{
    submissions: NoundrySubmission[];
  }>("/api/noundry/submissions", fetcher);

  const artistSubmissions = useMemo(
    () =>
      data?.submissions.filter(
        (submission) => submission.artist.toLowerCase() === artist.toLowerCase()
      ) || [],
    [artist, data?.submissions]
  );
  const traitCounts = useMemo(
    () =>
      artistSubmissions.reduce<Record<string, number>>((counts, submission) => {
        counts[submission.traitType] = (counts[submission.traitType] || 0) + 1;
        return counts;
      }, {}),
    [artistSubmissions]
  );
  const loadError = artworkError?.message || submissionsError?.message;

  return (
    <Layout>
      <Head>
        <title>{artistDisplayName || "Noundry Artist"} | Noundry Artists</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 pb-12">
        <Link
          href="/noundry?tab=gallery"
          className="flex w-fit items-center gap-2 font-heading text-sm uppercase text-skin-base transition hover:opacity-80"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none">
            <ArrowLeftIcon className="h-4 text-skin-base" />
          </span>
          Back to gallery
        </Link>

        <section className="rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="font-heading text-sm uppercase text-secondary">
                Noundry artist
              </div>
              <h1 className="mt-2 truncate font-heading text-[40px] leading-none text-skin-base md:text-[58px]">
                {artistDisplayName}
              </h1>
              <p className="mt-3 max-w-3xl break-all text-sm leading-snug text-secondary md:text-base">
                <WalletIdentityLink address={artist} fallback="full" />
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatPill label="Submissions" value={artistSubmissions.length} />
              <StatPill
                label="Trait types"
                value={Object.keys(traitCounts).length}
              />
              <StatPill
                label="Latest"
                value={
                  artistSubmissions[0]
                    ? formatRelativeTime(artistSubmissions[0].createdAt)
                    : "-"
                }
              />
            </div>
          </div>

          {Object.keys(traitCounts).length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {Object.entries(traitCounts).map(([traitType, count]) => (
                <span
                  key={traitType}
                  className="rounded-full bg-[#fff7bf] px-3 py-1.5 font-heading text-xs text-skin-base"
                >
                  {getLayerLabel(traitType)} x {count}
                </span>
              ))}
            </div>
          )}
        </section>

        {loadError && (
          <section className="rounded-2xl border border-skin-stroke bg-white p-6 text-skin-proposal-danger shadow-sm">
            {loadError}
          </section>
        )}

        {!loadError && artistSubmissions.length === 0 && (
          <section className="rounded-2xl border border-dashed border-skin-stroke bg-white p-10 text-center shadow-sm">
            <h2 className="font-heading text-3xl leading-none text-skin-base">
              No approved traits for this artist
            </h2>
            <p className="mt-3 text-secondary">
              This profile will populate after approved Noundry submissions are
              available.
            </p>
          </section>
        )}

        {artistSubmissions.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {artistSubmissions.map((submission) => (
              <SubmissionGalleryCard
                key={submission.id}
                artwork={artwork}
                submission={submission}
                footer={
                  <div className="mt-4 rounded-xl border border-skin-stroke bg-[#f7f7f7] px-3 py-2 text-sm text-secondary">
                    Submitted {formatRelativeTime(submission.createdAt)}
                  </div>
                }
              />
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
}

const StatPill = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="rounded-xl border border-skin-stroke bg-[#f7f7f7] px-4 py-3">
    <div className="font-heading text-2xl leading-none text-skin-base">
      {value}
    </div>
    <div className="mt-1 text-xs uppercase text-secondary">{label}</div>
  </div>
);
