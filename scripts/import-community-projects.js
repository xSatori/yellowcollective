const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const rootDirectory = path.join(__dirname, "..");
const projectsDirectory = path.join(rootDirectory, "data", "community-projects");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[match[1]] = value;
  }
};

loadEnvFile(path.join(rootDirectory, ".env.local"));

const connectionString =
  process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_PUBLIC_URL or DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 10000,
  max: 2,
  ssl: connectionString.includes("railway.internal")
    ? undefined
    : { rejectUnauthorized: false },
});

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_project_submissions (
      id text PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      description text NOT NULL,
      details jsonb NOT NULL DEFAULT '[]'::jsonb,
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
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS community_project_submissions_status_idx
    ON community_project_submissions(status)
  `);
};

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isLinksArray = (value) =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.title === "string" &&
      typeof item.href === "string"
  );

const validateProject = (project, fileName) => {
  const requiredStringFields = [
    "slug",
    "title",
    "description",
    "artist",
    "category",
    "date",
    "href",
    "image",
  ];

  for (const field of requiredStringFields) {
    if (typeof project[field] !== "string" || !project[field].trim()) {
      throw new Error(`${fileName} is missing a valid "${field}" field.`);
    }
  }

  if (!isStringArray(project.details)) {
    throw new Error(`${fileName} is missing a valid "details" array.`);
  }

  if (!isStringArray(project.galleryImages)) {
    throw new Error(`${fileName} is missing a valid "galleryImages" array.`);
  }

  if (!isLinksArray(project.links)) {
    throw new Error(`${fileName} is missing a valid "links" array.`);
  }
};

const upsertProject = async (project) => {
  await pool.query(
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
        links,
        status,
        approved_at,
        removed_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11::jsonb,
        $12::jsonb,
        'approved',
        now(),
        NULL
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        details = EXCLUDED.details,
        artist = EXCLUDED.artist,
        category = EXCLUDED.category,
        project_date = EXCLUDED.project_date,
        href = EXCLUDED.href,
        image = EXCLUDED.image,
        gallery_images = EXCLUDED.gallery_images,
        links = EXCLUDED.links,
        status = 'approved',
        approved_at = COALESCE(community_project_submissions.approved_at, now()),
        removed_at = NULL,
        updated_at = now()
    `,
    [
      `legacy-${project.slug}`,
      project.slug,
      project.title,
      project.description,
      JSON.stringify(project.details),
      project.artist,
      project.category,
      project.date,
      project.href,
      project.image,
      JSON.stringify(project.galleryImages),
      JSON.stringify(project.links),
    ]
  );
};

const main = async () => {
  await ensureTable();

  const files = fs
    .readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  let imported = 0;
  const skipped = [];

  for (const fileName of files) {
    const filePath = path.join(projectsDirectory, fileName);

    try {
      const project = JSON.parse(fs.readFileSync(filePath, "utf8"));
      validateProject(project, fileName);
      await upsertProject(project);
      imported += 1;
    } catch (error) {
      skipped.push(`${fileName}: ${error.message}`);
    }
  }

  const statusCounts = await pool.query(`
    SELECT status, count(*)::int AS count
    FROM community_project_submissions
    GROUP BY status
    ORDER BY status
  `);

  console.log(`Imported ${imported} approved community projects.`);

  if (skipped.length) {
    console.log("Skipped projects:");
    for (const line of skipped) console.log(`- ${line}`);
  }

  console.table(statusCounts.rows);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
