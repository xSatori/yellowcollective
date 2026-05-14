import {
  communityProjects,
  getInvalidCommunityProjectMemberAddresses,
  normalizeCommunityProjectMemberAddresses,
  type CommunityProject,
} from "data/community";
import {
  getApprovedCommunityProjectBySlug,
  listApprovedCommunityProjects,
} from "data/community-project-submissions";
import {
  normalizeSafeImageUrl,
  normalizeSafeProjectUrl,
} from "@/utils/url-safety";
import fs from "fs";
import path from "path";

const communityProjectsDirectory = path.join(
  process.cwd(),
  "data",
  "community-projects"
);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isProjectLinks = (value: unknown): value is CommunityProject["links"] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as { title?: unknown }).title === "string" &&
      typeof (item as { href?: unknown }).href === "string"
  );

const normalizeProject = (project: CommunityProject): CommunityProject => ({
  ...project,
  href: normalizeSafeProjectUrl(project.href, { allowInternal: true }),
  image: normalizeSafeImageUrl(project.image, { allowInternal: true }),
  galleryImages: (project.galleryImages || [])
    .map((image) => normalizeSafeImageUrl(image, { allowInternal: true }))
    .filter(Boolean),
  links: (project.links || [])
    .map((link) => ({
      ...link,
      href: normalizeSafeProjectUrl(link.href, { allowInternal: true }),
    }))
    .filter((link) => link.title && link.href),
  memberAddresses: normalizeCommunityProjectMemberAddresses(
    project.memberAddresses
  ),
});

const isCommunityProject = (value: unknown): value is CommunityProject => {
  if (!value || typeof value !== "object") return false;

  const project = value as Partial<CommunityProject>;
  if (
    typeof project.slug !== "string" ||
    typeof project.title !== "string" ||
    typeof project.description !== "string" ||
    !isStringArray(project.details) ||
    typeof project.artist !== "string" ||
    typeof project.category !== "string" ||
    typeof project.date !== "string" ||
    typeof project.href !== "string" ||
    typeof project.image !== "string"
  ) {
    return false;
  }

  if (project.galleryImages && !isStringArray(project.galleryImages)) {
    return false;
  }

  if (project.links && !isProjectLinks(project.links)) {
    return false;
  }

  if (getInvalidCommunityProjectMemberAddresses(project.memberAddresses).length) {
    return false;
  }

  if (
    !normalizeSafeProjectUrl(project.href, { allowInternal: true }) ||
    !normalizeSafeImageUrl(project.image, { allowInternal: true })
  ) {
    return false;
  }

  if (
    project.galleryImages?.some(
      (image) => !normalizeSafeImageUrl(image, { allowInternal: true })
    )
  ) {
    return false;
  }

  if (
    project.links?.some(
      (link) => !normalizeSafeProjectUrl(link.href, { allowInternal: true })
    )
  ) {
    return false;
  }

  return Boolean(
    project.slug.trim() &&
      project.title.trim() &&
      project.description.trim() &&
      project.details.length &&
      project.artist.trim() &&
      project.category.trim() &&
      project.date.trim() &&
      project.href.trim() &&
      project.image.trim()
  );
};

const getLocalCommunityProjects = (): CommunityProject[] => {
  if (!fs.existsSync(communityProjectsDirectory)) return communityProjects;

  const submittedProjects = fs
    .readdirSync(communityProjectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const filePath = path.join(communityProjectsDirectory, fileName);

      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return isCommunityProject(parsed) ? normalizeProject(parsed) : null;
      } catch (error) {
        console.warn(`Unable to parse community project ${fileName}`, error);
        return null;
      }
    })
    .filter((project): project is CommunityProject => Boolean(project));

  return [
    ...communityProjects.map(normalizeProject),
    ...submittedProjects,
  ];
};

const dedupeProjects = (projects: CommunityProject[]) => {
  const projectBySlug = new Map<string, CommunityProject>();

  projects.forEach((project) => {
    projectBySlug.set(project.slug, project);
  });

  return Array.from(projectBySlug.values());
};

export const getCommunityProjects = async (): Promise<CommunityProject[]> => {
  const localProjects = getLocalCommunityProjects();

  try {
    const approvedProjects = await listApprovedCommunityProjects();
    return dedupeProjects([...localProjects, ...approvedProjects]);
  } catch (error) {
    console.warn("Unable to load approved community projects", error);
    return localProjects;
  }
};

export const getCommunityProject = async (slug: string) => {
  try {
    const approvedProject = await getApprovedCommunityProjectBySlug(slug);
    if (approvedProject) return approvedProject;
  } catch (error) {
    console.warn(`Unable to load approved community project ${slug}`, error);
  }

  const project = getLocalCommunityProjects().find(
    (project) => project.slug === slug
  );

  return project ? normalizeProject(project) : undefined;
};

export const getCommunityProjectsForMember = async (address: string) => {
  const normalizedAddress =
    normalizeCommunityProjectMemberAddresses([address])[0];
  if (!normalizedAddress) return [];

  const projects = await getCommunityProjects();
  const normalizedKey = normalizedAddress.toLowerCase();

  return projects.filter((project) =>
    normalizeCommunityProjectMemberAddresses(project.memberAddresses).some(
      (memberAddress) => memberAddress.toLowerCase() === normalizedKey
    )
  );
};
