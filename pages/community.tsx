import Layout from "@/components/Layout";
import { type CommunityProject } from "data/community";
import { getCommunityProjects } from "@/utils/community-projects";
import type { GetStaticPropsResult, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";

type CommunityPageProps = {
  projects: CommunityProject[];
};

export const getStaticProps = async (): Promise<
  GetStaticPropsResult<CommunityPageProps>
> => ({
  props: {
    projects: await getCommunityProjects(),
  },
});

export default function CommunityPage({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>Community | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 pb-12">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-[36px] leading-none md:text-[44px]">
              Community
            </h1>
            <p className="max-w-[720px] text-base leading-snug text-secondary md:text-lg">
              A gallery of projects, events, art, and community work from the
              Yellow Collective.
            </p>
          </div>
          <Link
            href="/community/submit"
            className="flex w-fit shrink-0 items-center justify-center rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
          >
            Submit project
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/community/${project.slug}`}
              aria-label={project.title}
              className="group block overflow-hidden rounded-2xl border border-skin-stroke bg-skin-muted shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.title}
                className="aspect-square h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
              />
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
