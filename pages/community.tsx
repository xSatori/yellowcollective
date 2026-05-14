import Layout from "@/components/Layout";
import { type CommunityProject } from "data/community";
import { isAdminAddress } from "@/utils/admin";
import { getCommunityProjects } from "@/utils/community-projects";
import type { GetStaticPropsResult, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useAccount } from "wagmi";

type CommunityPageProps = {
  projects: CommunityProject[];
};

export const getStaticProps = async (): Promise<
  GetStaticPropsResult<CommunityPageProps>
> => ({
  props: {
    projects: await getCommunityProjects(),
  },
  revalidate: 60,
});

export default function CommunityPage({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { address } = useAccount();
  const isAdmin = isAdminAddress(address);

  return (
    <Layout>
      <Head>
        <title>Projects | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 pb-12">
        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:flex-row md:items-start md:p-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-[36px] leading-none md:text-[44px]">
              Projects
            </h1>
            <p className="max-w-[720px] text-base leading-snug text-secondary md:text-lg">
              A gallery of projects, events, art, and community work from the
              Yellow Collective.
            </p>
          </div>
          <Link
            href="/projects/submit"
            className="flex w-fit shrink-0 items-center justify-center rounded-[18px] bg-[#1d9bf0] px-5 py-3 font-heading text-lg text-white shadow-[0px_4.02px_0px_0px_#0f5f99] transition hover:-translate-y-0.5 hover:bg-[#45adf5] hover:shadow-[0px_6px_0px_0px_#0f5f99] active:translate-y-1 active:shadow-none"
          >
            Submit project
          </Link>
        </section>

        {projects.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.slug}
                className="group overflow-hidden rounded-2xl border border-skin-stroke bg-white shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none"
              >
                <Link
                  href={`/projects/${project.slug}`}
                  aria-label={project.title}
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={project.title}
                    className="aspect-square w-full bg-skin-muted object-cover transition duration-200 group-hover:scale-[1.03]"
                  />
                  <div className="min-h-[86px] border-t border-skin-stroke bg-white p-4">
                    <h2 className="font-heading text-xl leading-tight text-skin-base">
                      {project.title}
                    </h2>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="border-t border-skin-stroke bg-[#fff7bf] p-3">
                    <Link
                      href={`/admin/dashboard?section=community&project=${project.slug}`}
                      className="flex w-full items-center justify-center rounded-xl border border-skin-stroke bg-white px-3 py-2 font-heading text-sm text-skin-base shadow-[0px_3px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fffdf0] active:translate-y-1 active:shadow-none"
                    >
                      Admin edit
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-skin-stroke bg-skin-muted p-6 text-base text-secondary md:text-lg">
            No projects have been submitted yet.
          </div>
        )}
      </div>
    </Layout>
  );
}
