import { communityProjects, type CommunityProject } from "data/community";
import fs from "fs";
import path from "path";

const communityProjectsDirectory = path.join(
  process.cwd(),
  "data",
  "community-projects"
);

const isCommunityProject = (value: unknown): value is CommunityProject => {
  if (!value || typeof value !== "object") return false;

  const project = value as Partial<CommunityProject>;
  return Boolean(
    project.slug &&
      project.title &&
      project.description &&
      Array.isArray(project.details) &&
      project.artist &&
      project.category &&
      project.date &&
      project.href &&
      project.image
  );
};

export const getCommunityProjects = async (): Promise<CommunityProject[]> => {
  if (!fs.existsSync(communityProjectsDirectory)) return communityProjects;

  const submittedProjects = fs
    .readdirSync(communityProjectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const filePath = path.join(communityProjectsDirectory, fileName);

      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return isCommunityProject(parsed) ? parsed : null;
      } catch (error) {
        console.warn(`Unable to parse community project ${fileName}`, error);
        return null;
      }
    })
    .filter((project): project is CommunityProject => Boolean(project));

  return [...communityProjects, ...submittedProjects];
};
