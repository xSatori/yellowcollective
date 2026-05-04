import Layout from "@/components/Layout";
import { communityProjects, type CommunityProject } from "data/community";
import type {
  GetStaticPaths,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";

type CommunityDetailProps = {
  project: CommunityProject;
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: communityProjects.map((project) => ({
    params: { slug: project.slug },
  })),
  fallback: false,
});

export const getStaticProps = async ({
  params,
}: {
  params?: { slug?: string };
}): Promise<GetStaticPropsResult<CommunityDetailProps>> => {
  const project = communityProjects.find((item) => item.slug === params?.slug);

  if (!project) return { notFound: true };

  return {
    props: { project },
  };
};

export default function CommunityDetailPage({
  project,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const isExternal = project.href.startsWith("http");

  return (
    <Layout>
      <Head>
        <title>{project.title} | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-7 pb-12">
        <Link
          href="/community"
          className="w-fit font-heading text-lg text-secondary transition hover:text-skin-base"
        >
          Back to community
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.title}
          className="max-h-[520px] w-full rounded-2xl border border-skin-stroke bg-skin-muted object-cover shadow-sm"
        />

        <div className="grid gap-8 md:grid-cols-[1fr_280px]">
          <section className="flex flex-col gap-5">
            <div className="caption font-semibold text-secondary">
              {project.category} / {project.date}
            </div>
            <h1 className="text-[34px] leading-none md:text-[42px]">
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
          </section>

          <aside className="h-fit rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm">
            <dl className="flex flex-col gap-4 text-base">
              <div>
                <dt className="font-heading text-xl">Project</dt>
                <dd className="mt-1 text-secondary">{project.category}</dd>
              </div>
              <div>
                <dt className="font-heading text-xl">Artist</dt>
                <dd className="mt-1 text-secondary">{project.artist}</dd>
              </div>
              <div>
                <dt className="font-heading text-xl">Contributor</dt>
                <dd className="mt-1 text-secondary">{project.contributor}</dd>
              </div>
              <div>
                <dt className="font-heading text-xl">Season</dt>
                <dd className="mt-1 text-secondary">{project.date}</dd>
              </div>
            </dl>

            <Link
              href={project.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-skin-stroke bg-skin-backdrop px-5 py-3 font-heading text-lg transition hover:bg-[#fff7bf]"
            >
              View source
            </Link>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
