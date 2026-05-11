import Layout from "@/components/Layout";
import {
  NoundrySubmission,
  NounPreviewTile,
  buildRandomTraits,
  formatRelativeTime,
  getArtistPath,
  getLayerLabel,
  getSubmissionPreviewTraits,
  getTraitPath,
  shortenAddress,
} from "@/components/noundry/NoundryPreview";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import type { PlaygroundArtwork } from "data/nouns-builder/artwork";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load Noundry data.");
  }

  return data;
};

export default function NoundryTraitPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { data: artwork, error: artworkError } = useSWR<PlaygroundArtwork>(
    "/api/playground/artwork",
    fetcher
  );
  const { data, error: submissionsError } = useSWR<{
    submissions: NoundrySubmission[];
  }>("/api/noundry/submissions", fetcher);

  const submission = useMemo(
    () => data?.submissions.find((item) => item.id === id),
    [data?.submissions, id]
  );
  const artistSubmissions = useMemo(
    () =>
      submission
        ? data?.submissions.filter(
            (item) =>
              item.artist.toLowerCase() === submission.artist.toLowerCase()
          ) || []
        : [],
    [data?.submissions, submission]
  );
  const selectedTraits = useMemo(
    () => (submission ? getSubmissionPreviewTraits(submission) : {}),
    [submission]
  );
  const submittedTraitBase = useMemo(
    () =>
      submission && selectedTraits[submission.traitType]
        ? { [submission.traitType]: selectedTraits[submission.traitType] }
        : {},
    [selectedTraits, submission]
  );
  const generatedTraits = useMemo(
    () =>
      artwork && submission
        ? Array.from({ length: 8 }, (_, index) =>
            buildRandomTraits(
              artwork,
              `${submission.id}-generated-${index}`,
              submittedTraitBase
            )
          )
        : [],
    [artwork, submittedTraitBase, submission]
  );
  const collectionTraits = useMemo(
    () =>
      artwork && submission
        ? Array.from({ length: 8 }, (_, index) =>
            buildRandomTraits(
              artwork,
              `${submission.id}-collection-${index}`,
              index === 1 || index === 6 ? submittedTraitBase : {}
            )
          )
        : [],
    [artwork, submittedTraitBase, submission]
  );

  const loadError = artworkError?.message || submissionsError?.message;

  return (
    <Layout>
      <Head>
        <title>
          {submission
            ? `${submission.title} | Noundry`
            : "Noundry Trait | Yellow Collective"}
        </title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 pb-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/noundry?tab=gallery"
            className="flex w-fit items-center gap-2 font-heading text-sm uppercase text-skin-base transition hover:opacity-80"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none">
              <ArrowLeftIcon className="h-4 text-skin-base" />
            </span>
            Back to gallery
          </Link>
          {submission && (
            <Link
              href={getArtistPath(submission.artist)}
              className="rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-base text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
            >
              Artist profile
            </Link>
          )}
        </div>

        {loadError && (
          <section className="rounded-2xl border border-skin-stroke bg-white p-6 text-skin-proposal-danger shadow-sm">
            {loadError}
          </section>
        )}

        {!loadError && !submission && (
          <section className="rounded-2xl border border-dashed border-skin-stroke bg-white p-10 text-center shadow-sm">
            <h1 className="font-heading text-3xl leading-none text-skin-base">
              Trait not found
            </h1>
            <p className="mt-3 text-secondary">
              This submission is not approved or no longer exists.
            </p>
          </section>
        )}

        {submission && (
          <section className="grid gap-6 lg:grid-cols-[minmax(320px,440px)_1fr]">
            <aside className="overflow-hidden rounded-2xl border border-skin-stroke bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-heading text-4xl leading-none text-skin-base md:text-5xl">
                      {submission.title}
                    </h1>
                    <div className="mt-2 font-heading text-lg uppercase text-secondary">
                      {getLayerLabel(submission.traitType)}
                    </div>
                  </div>
                  <div className="rounded-sm bg-[#d8d8df] px-3 py-2 font-heading text-xs uppercase tracking-normal text-secondary">
                    {getLayerLabel(submission.traitType)}
                  </div>
                </div>

                <div className="mt-5 aspect-square bg-[#d7d9e4] p-8">
                  <NounPreviewTile
                    artwork={artwork}
                    submission={submission}
                    traits={selectedTraits}
                    showEditedTrait
                  />
                </div>

                <div className="mt-3 text-sm text-secondary">
                  {formatRelativeTime(submission.createdAt)}
                </div>
                <Link
                  href={getArtistPath(submission.artist)}
                  className="mt-4 flex min-w-0 items-center gap-3 rounded-xl border border-skin-stroke bg-[#f7f7f7] p-3 transition hover:bg-[#fff7bf]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-heading text-sm text-skin-base">
                    {submission.artist.slice(2, 4).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-heading text-base text-skin-base">
                      {shortenAddress(submission.artist)}
                    </span>
                    <span className="block text-xs text-secondary">
                      {artistSubmissions.length} submission
                      {artistSubmissions.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              </div>
              <div className="border-t border-skin-stroke p-4">
                <Link
                  href={`/noundry?tab=gallery`}
                  className="flex w-full items-center justify-center rounded-xl border border-skin-stroke bg-accent px-3 py-2 font-heading text-sm text-skin-base shadow-[0px_3px_0px_0px_#a98700] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] active:translate-y-1 active:shadow-none"
                >
                  Remix in studio
                </Link>
              </div>
            </aside>

            <div className="flex flex-col gap-6">
              <NounGridSection
                artwork={artwork}
                submission={submission}
                title="Generated with this trait"
                traits={generatedTraits}
                editedIndexes={generatedTraits.map((_, index) => index)}
              />
              <NounGridSection
                artwork={artwork}
                submission={submission}
                title="Randomized from the collection"
                traits={collectionTraits}
                editedIndexes={[1, 6]}
              />
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

const NounGridSection = ({
  artwork,
  submission,
  title,
  traits,
  editedIndexes,
}: {
  artwork?: PlaygroundArtwork;
  submission: NoundrySubmission;
  title: string;
  traits: Record<string, string>[];
  editedIndexes: number[];
}) => (
  <section className="rounded-none border-y-4 border-[#e5e7eb] bg-white px-5 py-6 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="font-heading text-2xl leading-none text-skin-base">
        {title}
      </h2>
      <Link
        href={getTraitPath(submission.id)}
        className="font-heading text-xs uppercase text-secondary"
      >
        Noundry
      </Link>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {traits.map((traitSet, index) => (
        <NounPreviewTile
          key={`${title}-${index}`}
          artwork={artwork}
          submission={submission}
          traits={traitSet}
          showEditedTrait={editedIndexes.includes(index)}
        />
      ))}
    </div>
  </section>
);
