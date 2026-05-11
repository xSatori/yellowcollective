import Layout from "@/components/Layout";
import { type CommunityProject } from "data/community";
import {
  getCommunityProject,
  getCommunityProjects,
} from "@/utils/community-projects";
import { isAdminAddress } from "@/utils/admin";
import type {
  GetStaticPaths,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from "next";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";

type CommunityDetailProps = {
  project: CommunityProject;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCommunityProjects();

  return {
    paths: projects.map((project) => ({
      params: { slug: project.slug },
    })),
    fallback: "blocking",
  };
};

export const getStaticProps = async ({
  params,
}: {
  params?: { slug?: string };
}): Promise<GetStaticPropsResult<CommunityDetailProps>> => {
  const project = params?.slug
    ? await getCommunityProject(params.slug)
    : undefined;

  if (!project) return { notFound: true, revalidate: 60 };

  return {
    props: { project },
    revalidate: 60,
  };
};

export default function CommunityDetailPage({
  project,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const isExternal = project.href.startsWith("http");
  const { address } = useAccount();
  const isAdmin = isAdminAddress(address);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <Layout>
      <Head>
        <title>{project.title} | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-7 pb-12">
        <Link
          href="/community"
          className="flex w-fit items-center gap-2 font-heading text-lg text-skin-base transition hover:opacity-80"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none">
            <ArrowLeftIcon className="h-4 text-skin-base" />
          </span>
          Community
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.title}
          className="max-h-[520px] w-full rounded-2xl border border-skin-stroke bg-skin-muted object-cover shadow-sm"
        />

        <div className="grid gap-8 md:grid-cols-[1fr_280px]">
          <section className="flex flex-col gap-5 rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm md:p-7">
            <div className="caption font-semibold text-secondary">
              {project.category} / {project.date}
            </div>
            <h1 className="font-heading text-[34px] leading-none md:text-[42px]">
              {project.title}
            </h1>
            <p className="text-lg leading-snug text-skin-base">
              {project.description}
            </p>
            <div className="flex flex-col gap-4 text-base leading-snug text-secondary md:text-lg">
              {project.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </div>
            {project.galleryImages && project.galleryImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {project.galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className="group block overflow-hidden rounded-2xl border border-skin-stroke bg-skin-muted shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${project.title} gallery image ${index + 1}`}
                      className="aspect-square h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm">
            <dl className="flex flex-col gap-4 text-base">
              <div>
                <dt className="font-heading text-xl">Category</dt>
                <dd className="mt-1 text-secondary">{project.category}</dd>
              </div>
              <div>
                <dt className="font-heading text-xl">Artist</dt>
                <dd className="mt-1 text-secondary">{project.artist}</dd>
              </div>
            </dl>

            <Link
              href={project.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className="mt-6 flex w-full items-center justify-center rounded-[18px] bg-accent px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#b89400] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] hover:shadow-[0px_6px_0px_0px_#b89400] active:translate-y-1 active:shadow-none"
            >
              View source
            </Link>
            {isAdmin && (
              <Link
                href={`/admin/dashboard?section=community&project=${project.slug}`}
                className="mt-3 flex w-full items-center justify-center rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
              >
                Admin edit
              </Link>
            )}
            {project.links && project.links.length > 0 && (
              <div className="mt-5 flex flex-col gap-3">
                {project.links.map((link) => {
                  const isLinkExternal = link.href.startsWith("http");

                  return (
                    <Link
                      key={`${link.title}-${link.href}`}
                      href={link.href}
                      target={isLinkExternal ? "_blank" : undefined}
                      rel={isLinkExternal ? "noreferrer" : undefined}
                      className="font-heading text-base text-skin-base underline transition hover:opacity-70"
                    >
                      {link.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <div className="relative max-h-full max-w-5xl">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white font-heading text-xl text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
              aria-label="Close image"
            >
              X
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt={`${project.title} enlarged gallery image`}
              className="max-h-[86vh] max-w-full rounded-2xl border border-skin-stroke bg-skin-muted object-contain shadow-xl"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
