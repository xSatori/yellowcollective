import { randomUUID } from "crypto";
import { Pool } from "pg";
import type { CommunityProject } from "./community";

export type CommunityProjectStatus = "pending" | "approved" | "removed";

export type CommunityProjectSubmissionInput = CommunityProject;
type ProjectLinks = NonNullable<CommunityProject["links"]>;

export type CommunityProjectRecord = CommunityProject & {
  id: string;
  status: CommunityProjectStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  removedAt: string | null;
};

const MAX_SHORT_TEXT = 160;
const MAX_LONG_TEXT = 2000;

let pool: Pool | null = null;
let tableReady: Promise<void> | null = null;

const getConnectionString = () =>
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const getPool = () => {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10000,
      max: 2,
      ssl: connectionString.includes("railway.internal")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }

  return pool;
};

const ensureTable = async () => {
  if (!tableReady) {
    tableReady = getPool()
      .query(
        `
          CREATE TABLE IF NOT EXISTS community_project_submissions (
            id text PRIMARY KEY,
            slug text NOT NULL UNIQUE,
            title text NOT NULL,
            description text NOT NULL,
            details jsonb NOT NULL,
            artist text NOT NULL,
            category text NOT NULL,
            project_date text NOT NULL,
            href text NOT NULL,
            image text NOT NULL,
            gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
            links jsonb NOT NULL DEFAULT '[]'::jsonb,
            status text NOT NULL DEFAULT 'pending',
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            approved_at timestamptz,
            removed_at timestamptz
          )
        `
      )
      .then(() =>
        getPool().query(`
          ALTER TABLE community_project_submissions
            ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS approved_at timestamptz,
            ADD COLUMN IF NOT EXISTS removed_at timestamptz
        `)
      )
      .then(() => undefined);
  }

  return tableReady;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isProjectLinks = (value: unknown): value is ProjectLinks =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as { title?: unknown }).title === "string" &&
      typeof (item as { href?: unknown }).href === "string"
  );

const parseJson = <T>(value: T | string): T =>
  typeof value === "string" ? JSON.parse(value) : value;

const normalizeOptionalStringArray = (value: unknown) =>
  isStringArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [];

const normalizeProjectLinks = (value: unknown): ProjectLinks =>
  isProjectLinks(value)
    ? value
        .map((link) => ({
          title: link.title.trim(),
          href: link.href.trim(),
        }))
        .filter((link) => link.title && link.href)
    : [];

export const normalizeCommunityProjectInput = (
  input: Partial<CommunityProjectSubmissionInput>
): CommunityProjectSubmissionInput => ({
  slug: String(input.slug || "")
    .trim()
    .toLowerCase(),
  title: String(input.title || "").trim(),
  description: String(input.description || "").trim(),
  details: isStringArray(input.details)
    ? input.details.map((detail) => detail.trim()).filter(Boolean)
    : [],
  artist: String(input.artist || "").trim(),
  category: String(input.category || "").trim(),
  date: String(input.date || "").trim(),
  href: String(input.href || "").trim(),
  image: String(input.image || "").trim(),
  galleryImages: normalizeOptionalStringArray(input.galleryImages),
  links: normalizeProjectLinks(input.links),
});

export const validateCommunityProjectInput = (
  input: Partial<CommunityProjectSubmissionInput>
) => {
  const project = normalizeCommunityProjectInput(input);

  if (!project.slug || !/^[a-z0-9-]+$/.test(project.slug)) {
    return "A valid project slug is required.";
  }

  if (!project.title || project.title.length > MAX_SHORT_TEXT) {
    return "A project title is required and must be short.";
  }

  if (
    !project.description ||
    project.description.length > MAX_LONG_TEXT ||
    !project.details.length ||
    !project.artist ||
    !project.category ||
    !project.date ||
    !project.href ||
    !project.image
  ) {
    return "Complete all required project fields before submitting.";
  }

  return undefined;
};

const formatDate = (value: Date | string | null) => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const mapProject = (row: {
  id: string;
  slug: string;
  title: string;
  description: string;
  details: string[] | string;
  artist: string;
  category: string;
  project_date: string;
  href: string;
  image: string;
  gallery_images: string[] | string;
  links: CommunityProject["links"] | string;
  status: CommunityProjectStatus;
  created_at: Date | string;
  updated_at: Date | string;
  approved_at: Date | string | null;
  removed_at: Date | string | null;
}): CommunityProjectRecord => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  details: parseJson(row.details),
  artist: row.artist,
  category: row.category,
  date: row.project_date,
  href: row.href,
  image: row.image,
  galleryImages: parseJson(row.gallery_images),
  links: parseJson(row.links),
  status: row.status,
  createdAt: formatDate(row.created_at) || "",
  updatedAt: formatDate(row.updated_at) || "",
  approvedAt: formatDate(row.approved_at),
  removedAt: formatDate(row.removed_at),
});

const selectFields = `
  id,
  slug,
  title,
  description,
  details,
  artist,
  category,
  project_date,
  href,
  image,
  gallery_images,
  links,
  status,
  created_at,
  updated_at,
  approved_at,
  removed_at
`;

export const listApprovedCommunityProjects = async (): Promise<
  CommunityProject[]
> => {
  await ensureTable();

  const result = await getPool().query(
    `
      SELECT ${selectFields}
      FROM community_project_submissions
      WHERE status = 'approved'
      ORDER BY approved_at DESC NULLS LAST, created_at DESC
    `
  );

  return result.rows.map(mapProject);
};

export const getApprovedCommunityProjectBySlug = async (slug: string) => {
  await ensureTable();

  const result = await getPool().query(
    `
      SELECT ${selectFields}
      FROM community_project_submissions
      WHERE slug = $1 AND status = 'approved'
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
};

export const listAdminCommunityProjects = async () => {
  await ensureTable();

  const result = await getPool().query(
    `
      SELECT ${selectFields}
      FROM community_project_submissions
      ORDER BY
        CASE status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          ELSE 2
        END,
        created_at DESC
    `
  );

  return result.rows.map(mapProject);
};

export const createCommunityProjectSubmission = async (
  input: CommunityProjectSubmissionInput
) => {
  const validationError = validateCommunityProjectInput(input);
  if (validationError) throw new Error(validationError);

  await ensureTable();

  const project = normalizeCommunityProjectInput(input);
  const result = await getPool().query(
    `
      INSERT INTO community_project_submissions (
        id,
        slug,
        title,
        description,
        details,
        artist,
        category,
        project_date,
        href,
        image,
        gallery_images,
        links
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
      RETURNING ${selectFields}
    `,
    [
      randomUUID(),
      project.slug,
      project.title,
      project.description,
      JSON.stringify(project.details),
      project.artist,
      project.category,
      project.date,
      project.href,
      project.image,
      JSON.stringify(project.galleryImages || []),
      JSON.stringify(project.links || []),
    ]
  );

  return mapProject(result.rows[0]);
};

export const approveCommunityProject = async (id: string) => {
  await ensureTable();

  const result = await getPool().query(
    `
      UPDATE community_project_submissions
      SET status = 'approved',
        approved_at = now(),
        removed_at = NULL,
        updated_at = now()
      WHERE id = $1
      RETURNING ${selectFields}
    `,
    [id]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
};

export const updateCommunityProject = async (
  id: string,
  input: Partial<CommunityProjectSubmissionInput>
) => {
  await ensureTable();

  const currentResult = await getPool().query(
    `SELECT ${selectFields} FROM community_project_submissions WHERE id = $1`,
    [id]
  );
  const current = currentResult.rows[0] ? mapProject(currentResult.rows[0]) : null;
  if (!current) return null;

  const project = normalizeCommunityProjectInput({ ...current, ...input });
  const validationError = validateCommunityProjectInput(project);
  if (validationError) throw new Error(validationError);

  const result = await getPool().query(
    `
      UPDATE community_project_submissions
      SET slug = $2,
        title = $3,
        description = $4,
        details = $5::jsonb,
        artist = $6,
        category = $7,
        project_date = $8,
        href = $9,
        image = $10,
        gallery_images = $11::jsonb,
        links = $12::jsonb,
        updated_at = now()
      WHERE id = $1
      RETURNING ${selectFields}
    `,
    [
      id,
      project.slug,
      project.title,
      project.description,
      JSON.stringify(project.details),
      project.artist,
      project.category,
      project.date,
      project.href,
      project.image,
      JSON.stringify(project.galleryImages || []),
      JSON.stringify(project.links || []),
    ]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
};

export const removeCommunityProject = async (id: string) => {
  await ensureTable();

  const result = await getPool().query(
    `
      UPDATE community_project_submissions
      SET status = 'removed',
        removed_at = now(),
        updated_at = now()
      WHERE id = $1
      RETURNING ${selectFields}
    `,
    [id]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
};
