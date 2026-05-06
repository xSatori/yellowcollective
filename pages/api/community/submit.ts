import type { NextApiRequest, NextApiResponse } from "next";

type CommunityProjectPayload = {
  slug: string;
  title: string;
  description: string;
  details: string[];
  artist: string;
  category: string;
  date: string;
  href: string;
  image: string;
  galleryImages: string[];
  links: { title: string; href: string }[];
};

type UploadedImagePayload = {
  name: string;
  type: string;
  dataUrl: string;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

const repo =
  process.env.COMMUNITY_SUBMISSIONS_REPO ||
  "Yellow-Collective/yellow-collective";
const baseBranch = process.env.COMMUNITY_SUBMISSIONS_BASE_BRANCH || "main";
const githubToken =
  process.env.COMMUNITY_SUBMISSIONS_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

const jsonHeaders = {
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const sanitizePathSegment = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const validateProject = (project: CommunityProjectPayload) => {
  if (!project.slug || !/^[a-z0-9-]+$/.test(project.slug)) {
    return "Invalid project slug.";
  }

  const requiredFields: Array<keyof CommunityProjectPayload> = [
    "title",
    "description",
    "artist",
    "category",
    "date",
    "href",
    "image",
  ];

  for (const field of requiredFields) {
    if (!String(project[field] || "").trim()) {
      return `Missing ${field}.`;
    }
  }

  if (!Array.isArray(project.details) || project.details.length === 0) {
    return "At least one detail paragraph is required.";
  }

  return undefined;
};

const parseImage = (image?: UploadedImagePayload) => {
  if (!image) return undefined;

  if (
    !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(image.type)
  ) {
    throw new Error("Image must be PNG, JPG, WEBP, or GIF.");
  }

  const match = image.dataUrl.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
  );
  if (!match) throw new Error("Invalid image upload.");

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5MB.");
  }

  const extension = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
  }[image.type];
  const fileName = sanitizePathSegment(image.name).replace(/\.[^.]+$/, "");

  return {
    content: buffer.toString("base64"),
    path: `public/community-projects/${fileName || "image"}${extension}`,
  };
};

const githubRequest = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...init,
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${githubToken}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
};

const putFile = async ({
  branch,
  path,
  content,
  message,
}: {
  branch: string;
  path: string;
  content: string;
  message: string;
}) => {
  return githubRequest(
    `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
    {
      method: "PUT",
      body: JSON.stringify({
        branch,
        message,
        content,
      }),
    }
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!githubToken) {
    return res.status(501).json({
      error:
        "Image-backed PR submission requires COMMUNITY_SUBMISSIONS_GITHUB_TOKEN.",
    });
  }

  try {
    const project = req.body.project as CommunityProjectPayload;
    const image = parseImage(
      req.body.image as UploadedImagePayload | undefined
    );
    const imagePath = image
      ? `public/community-projects/${project.slug}/${image.path.split("/").pop()}`
      : "";
    const projectWithImage = image
      ? {
          ...project,
          image: `/${imagePath.replace(/^public\//, "")}`,
        }
      : project;
    const validationError = validateProject(projectWithImage);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const branch = `community-project/${project.slug}-${Date.now()}`;
    const ref = await githubRequest<{ object: { sha: string } }>(
      `/git/ref/heads/${baseBranch}`
    );

    await githubRequest("/git/refs", {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: ref.object.sha,
      }),
    });

    if (image) {
      await putFile({
        branch,
        path: imagePath,
        content: image.content,
        message: `Add community project image: ${project.title}`,
      });
    }

    await putFile({
      branch,
      path: `data/community-projects/${project.slug}.json`,
      content: Buffer.from(
        JSON.stringify(projectWithImage, null, 2) + "\n"
      ).toString("base64"),
      message: `Add community project: ${project.title}`,
    });

    const pull = await githubRequest<{ html_url: string }>("/pulls", {
      method: "POST",
      body: JSON.stringify({
        title: `Add community project: ${project.title}`,
        head: branch,
        base: baseBranch,
        body: `Adds ${project.title} to the Yellow Collective community gallery.`,
      }),
    });

    return res.status(200).json({ pullRequestUrl: pull.html_url });
  } catch (error) {
    console.error("Community submission failed", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Submission failed.",
    });
  }
}
