import Layout from "@/components/Layout";
import { communityProjects } from "data/community";
import Head from "next/head";
import Link from "next/link";

export default function CommunityPage() {
  return (
    <Layout>
      <Head>
        <title>Community | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 pb-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-[36px] leading-none md:text-[44px]">Community</h1>
          <p className="max-w-[720px] text-base leading-snug text-secondary md:text-lg">
            A gallery of projects, events, grants, art, and experiments from the
            Yellow Collective community.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {communityProjects.map((project) => (
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
