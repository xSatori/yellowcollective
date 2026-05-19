import {
  GetStaticPropsContext,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from "next";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { promises as fs } from "fs";
import path from "path";
import Layout from "@/components/Layout";

const RESERVED_PAGE_SLUGS = new Set([
  "about",
  "community",
  "contracts",
  "create-proposal",
  "projects",
  "proposals",
  "treasury",
]);

const templateDirectory = path.join(process.cwd(), "templates");

const isMissingFileError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as NodeJS.ErrnoException).code === "ENOENT";

export const getStaticPaths = async () => {
  let files: Awaited<ReturnType<typeof fs.readdir>>;

  try {
    files = await fs.readdir(templateDirectory, { withFileTypes: true });
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        paths: [],
        fallback: false,
      };
    }

    throw error;
  }

  const paths = files
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".md"))
    .map((file) => file.name.replace(/\.md?$/, ""))
    .filter((slug) => !RESERVED_PAGE_SLUGS.has(slug))
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (
  ctx: GetStaticPropsContext<{ slug: string }>
): Promise<
  GetStaticPropsResult<{
    data: MDXRemoteSerializeResult<Record<string, unknown>>;
  }>
> => {
  const { slug } = ctx.params!;
  let source: string;

  try {
    source = await fs.readFile(
      path.join(templateDirectory, `${slug}.md`),
      "utf8"
    );
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        notFound: true,
      };
    }

    throw error;
  }

  const mdxSource = await serialize(source, { parseFrontmatter: true });

  return {
    props: {
      data: mdxSource,
    },
    revalidate: 60,
  };
};

export default function SiteComponent(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { data } = props;
  const align = data.frontmatter?.align;

  const getAlignment = () => {
    switch (align) {
      case "center":
        return "text-center flex flex-col items-center";
      case "right":
        return "text-right";
      default:
        return "";
    }
  };
  return (
    <Layout>
      <div
        className={`h-full flex flex-col ${getAlignment()} w-full wrapper focus:outline-none break-words prose prose-skin prose-headings:font-heading prose-xl max-w-none`}
      >
        <MDXRemote {...data} />
      </div>
    </Layout>
  );
}
