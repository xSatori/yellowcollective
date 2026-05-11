import Layout from "@/components/Layout";
import { isAdminAddress } from "@/utils/admin";
import {
  createAdminAuthMessage,
  type AdminAuthPayload,
} from "@/utils/admin-auth";
import type { CommunityProject } from "data/community";
import type { CommunityProjectRecord } from "data/community-project-submissions";
import type { NoundrySubmission } from "data/noundry/submissions";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import useSWR, { type Fetcher, type KeyedMutator } from "swr";
import { useAccount, useSignMessage } from "wagmi";

type AdminSection = "community" | "noundry";
type CommunityListMode = "queue" | "existing";
type ProjectEditorMode = "edit" | "preview";

type AdminAuth = Required<
  Pick<AdminAuthPayload, "adminAddress" | "adminMessage" | "adminSignature">
>;

type AdminRequestBody = Record<string, unknown>;
type AdminSWRKey = readonly [string, AdminAuth];

const adminSections: { id: AdminSection; label: string }[] = [
  {
    id: "community",
    label: "Community Projects",
  },
  {
    id: "noundry",
    label: "Noundry Gallery",
  },
];

const communityListModes: { id: CommunityListMode; label: string }[] = [
  {
    id: "queue",
    label: "Queue",
  },
  {
    id: "existing",
    label: "Existing projects",
  },
];
const projectEditorModes: { id: ProjectEditorMode; label: string }[] = [
  {
    id: "edit",
    label: "Edit",
  },
  {
    id: "preview",
    label: "Preview",
  },
];

const fieldClass =
  "w-full rounded-[18px] border border-skin-stroke bg-white px-4 py-3 text-base text-skin-base outline-none transition focus:border-[#d7aa00] focus:ring-2 focus:ring-[#ffcc00]/30";
const labelClass = "block text-sm font-semibold text-secondary";
const primaryButtonClass =
  "rounded-[18px] bg-accent px-5 py-3 font-heading text-base text-skin-base shadow-[0px_4.02px_0px_0px_#b89400] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] hover:shadow-[0px_6px_0px_0px_#b89400] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "rounded-[18px] border border-skin-stroke bg-white px-5 py-3 font-heading text-base text-skin-base shadow-[0px_4.02px_0px_0px_#BBB] transition hover:-translate-y-0.5 hover:bg-[#fff7bf] hover:shadow-[0px_6px_0px_0px_#BBB] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";
const dangerButtonClass =
  "rounded-[18px] bg-[#c93d2f] px-5 py-3 font-heading text-base text-white shadow-[0px_4.02px_0px_0px_#7f2219] transition hover:-translate-y-0.5 hover:bg-[#d95042] hover:shadow-[0px_6px_0px_0px_#7f2219] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";

const createAuthQuery = (auth: AdminAuth) =>
  new URLSearchParams({
    adminAddress: auth.adminAddress,
    adminMessage: auth.adminMessage,
    adminSignature: auth.adminSignature,
  }).toString();

const createAdminFetcher =
  <T,>(): Fetcher<T, AdminSWRKey> =>
  async (key) => {
    const [url, auth] = key;
    const response = await fetch(`${url}?${createAuthQuery(auth)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Admin request failed.");
    }

    return data;
  };

const communityProjectsFetcher = createAdminFetcher<{
  projects: CommunityProjectRecord[];
}>();

const noundrySubmissionsFetcher = createAdminFetcher<{
  submissions: NoundrySubmission[];
}>();

const sendAdminRequest = async (
  path: string,
  auth: AdminAuth,
  method: "PATCH" | "DELETE",
  body: AdminRequestBody = {}
) => {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, ...auth }),
  });
  const responseText = await response.text();
  const data = responseText
    ? (() => {
        try {
          return JSON.parse(responseText);
        } catch {
          return { error: responseText };
        }
      })()
    : {};

  if (!response.ok) {
    throw new Error(data.error || "Admin update failed.");
  }

  return data;
};

const toLines = (items?: string[]) => (items || []).join("\n");

const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const formatLinks = (links?: CommunityProject["links"]) =>
  (links || []).map((link) => `${link.title} | ${link.href}`).join("\n");

const parseLinks = (value: string) =>
  fromLines(value)
    .map((line) => {
      const [title, ...hrefParts] = line.split("|");
      return {
        title: title.trim(),
        href: hrefParts.join("|").trim(),
      };
    })
    .filter((link) => link.title && link.href);

const formatTraits = (traits: Record<string, string>) =>
  Object.entries(traits || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

const parseTraits = (value: string) =>
  Object.fromEntries(
    fromLines(value)
      .map((line) => {
        const [key, ...valueParts] = line.split(":");
        return [key.trim(), valueParts.join(":").trim()];
      })
      .filter(([key, value]) => key && value)
  );

const getQueryValue = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : value?.[0];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isLoading: isSigning } = useSignMessage();
  const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const isAdmin = isAdminAddress(address);
  const activeSection: AdminSection =
    router.query.section === "noundry" ? "noundry" : "community";

  const communityKey = adminAuth
    ? (["/api/admin/community-projects", adminAuth] as const)
    : null;
  const noundryKey = adminAuth
    ? (["/api/admin/noundry-submissions", adminAuth] as const)
    : null;

  const {
    data: communityData,
    error: communityError,
    mutate: mutateCommunity,
  } = useSWR<{ projects: CommunityProjectRecord[] }, Error, AdminSWRKey | null>(
    communityKey,
    communityProjectsFetcher
  );
  const {
    data: noundryData,
    error: noundryError,
    mutate: mutateNoundry,
  } = useSWR<{ submissions: NoundrySubmission[] }, Error, AdminSWRKey | null>(
    noundryKey,
    noundrySubmissionsFetcher
  );

  useEffect(() => {
    if (!isAdmin) setAdminAuth(null);
  }, [isAdmin, address]);

  const authorize = async () => {
    if (!address) return;

    try {
      setAuthError(null);
      const adminMessage = createAdminAuthMessage(address);
      const adminSignature = await signMessageAsync({ message: adminMessage });
      setAdminAuth({
        adminAddress: address,
        adminMessage,
        adminSignature,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to authorize admin.";
      setAuthError(message);
    }
  };

  const setSection = (section: AdminSection) => {
    void router.push(
      { pathname: "/admin/dashboard", query: { section } },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard | Yellow Collective</title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 pb-12">
        <section className="rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-heading text-[42px] leading-none text-skin-base md:text-[58px]">
                Admin Dashboard
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-snug text-secondary">
                Review database submissions, approve community projects, and
                manage Noundry gallery entries.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={authorize}
                disabled={isSigning}
                className={primaryButtonClass}
              >
                {adminAuth
                  ? "Refresh admin signature"
                  : isSigning
                    ? "Signing..."
                    : "Authorize admin"}
              </button>
            )}
          </div>
        </section>

        {!isConnected && (
          <AdminNotice title="Connect wallet">
            Connect the admin wallet to load this dashboard.
          </AdminNotice>
        )}
        {isConnected && !isAdmin && (
          <AdminNotice title="Admin wallet required">
            This dashboard is only available to the configured admin wallet.
          </AdminNotice>
        )}
        {isAdmin && authError && (
          <AdminNotice title="Signature failed">{authError}</AdminNotice>
        )}
        {isAdmin && !adminAuth && (
          <AdminNotice title="Signature required">
            Sign the admin message to unlock project and gallery controls.
          </AdminNotice>
        )}

        {isAdmin && adminAuth && (
          <section className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-center gap-3 border-b border-skin-stroke">
              {adminSections.map((section) => {
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSection(section.id)}
                    className={`rounded-t-xl border border-b-0 border-skin-stroke px-5 py-3 font-heading text-base font-bold shadow-[4px_0px_0px_0px_#BBB] transition-colors active:translate-x-1 active:shadow-none ${
                      isActive
                        ? "bg-white text-skin-base"
                        : "bg-[#fff7bf] text-secondary hover:bg-white"
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
            {activeSection === "community" ? (
              <CommunityAdminPanel
                adminAuth={adminAuth}
                projects={communityData?.projects || []}
                error={communityError?.message}
                isLoading={!communityData && !communityError}
                mutate={mutateCommunity}
              />
            ) : (
              <NoundryAdminPanel
                adminAuth={adminAuth}
                submissions={noundryData?.submissions || []}
                error={noundryError?.message}
                isLoading={!noundryData && !noundryError}
                mutate={mutateNoundry}
              />
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

const AdminNotice = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm">
    <h2 className="font-heading text-2xl leading-none text-skin-base">
      {title}
    </h2>
    <p className="mt-2 text-base text-secondary">{children}</p>
  </section>
);

const StatusPill = ({ status }: { status: string }) => {
  const color =
    status === "approved"
      ? "bg-[#e7f7df] text-[#276514]"
      : status === "removed"
        ? "bg-[#f8d7d7] text-[#8c1d1d]"
        : "bg-[#fff7bf] text-[#6d5600]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
};

const CommunityAdminPanel = ({
  adminAuth,
  projects,
  error,
  isLoading,
  mutate,
}: {
  adminAuth: AdminAuth;
  projects: CommunityProjectRecord[];
  error?: string;
  isLoading: boolean;
  mutate: KeyedMutator<{ projects: CommunityProjectRecord[] }>;
}) => {
  const router = useRouter();
  const requestedSlug = getQueryValue(router.query.project);
  const activeMode: CommunityListMode =
    getQueryValue(router.query.mode) === "existing" ? "existing" : "queue";
  const visibleProjects = useMemo(
    () =>
      activeMode === "queue"
        ? projects.filter((project) => project.status === "pending")
        : projects.filter((project) => project.status === "approved"),
    [activeMode, projects]
  );
  const projectCounts = useMemo(
    () => ({
      queue: projects.filter((project) => project.status === "pending").length,
      existing: projects.filter((project) => project.status === "approved")
        .length,
    }),
    [projects]
  );
  const selectedProject = useMemo(
    () =>
      visibleProjects.find((project) => project.slug === requestedSlug) ||
      visibleProjects[0],
    [requestedSlug, visibleProjects]
  );

  const selectProject = (project: CommunityProjectRecord) => {
    void router.push(
      {
        pathname: "/admin/dashboard",
        query: {
          section: "community",
          mode: activeMode,
          project: project.slug,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const setCommunityMode = (mode: CommunityListMode) => {
    void router.push(
      {
        pathname: "/admin/dashboard",
        query: { section: "community", mode },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <AdminList
        title="Community Projects"
        error={error}
        isLoading={isLoading}
        header={
          <div className="mt-4 flex gap-1.5 rounded-xl border border-[#b6b6b6] bg-[#f1f1f1] p-1 shadow-[0px_4px_0px_0px_#b6b6b6]">
            {communityListModes.map((mode) => {
              const isActive = activeMode === mode.id;
              const count = projectCounts[mode.id];

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCommunityMode(mode.id)}
                  className={`flex-1 rounded-lg px-3 py-2 font-heading text-sm transition ${
                    isActive
                      ? "translate-y-[-1px] bg-accent text-skin-base shadow-[0px_3px_0px_0px_#b89400]"
                      : "text-secondary hover:bg-[#fff7bf] hover:text-skin-base"
                  }`}
                >
                  {mode.label} ({count})
                </button>
              );
            })}
          </div>
        }
      >
        {visibleProjects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => selectProject(project)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              selectedProject?.id === project.id
                ? "border-[#d7aa00] bg-[#fff7bf]"
                : "border-skin-stroke bg-white hover:bg-[#fffbe0]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-heading text-lg leading-tight text-skin-base">
                  {project.title}
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {project.slug}
                </div>
              </div>
              <StatusPill status={project.status} />
            </div>
          </button>
        ))}
        {!isLoading && !error && visibleProjects.length === 0 && (
          <p className="rounded-xl border border-dashed border-skin-stroke bg-white p-4 text-sm leading-snug text-secondary">
            {activeMode === "queue"
              ? "No submitted projects need review."
              : "No approved projects yet."}
          </p>
        )}
      </AdminList>

      {selectedProject ? (
        <ProjectEditor
          key={selectedProject.id}
          adminAuth={adminAuth}
          project={selectedProject}
          mutate={mutate}
        />
      ) : (
        <EmptyEditor
          title={
            activeMode === "queue"
              ? "No submitted projects need review"
              : "No approved community projects"
          }
        />
      )}
    </section>
  );
};

const NoundryAdminPanel = ({
  adminAuth,
  submissions,
  error,
  isLoading,
  mutate,
}: {
  adminAuth: AdminAuth;
  submissions: NoundrySubmission[];
  error?: string;
  isLoading: boolean;
  mutate: KeyedMutator<{ submissions: NoundrySubmission[] }>;
}) => {
  const router = useRouter();
  const requestedId = getQueryValue(router.query.submission);
  const selectedSubmission = useMemo(
    () =>
      submissions.find((submission) => submission.id === requestedId) ||
      submissions[0],
    [requestedId, submissions]
  );

  const selectSubmission = (submission: NoundrySubmission) => {
    void router.push(
      {
        pathname: "/admin/dashboard",
        query: { section: "noundry", submission: submission.id },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <AdminList title="Noundry Gallery" error={error} isLoading={isLoading}>
        {submissions.map((submission) => (
          <button
            key={submission.id}
            type="button"
            onClick={() => selectSubmission(submission)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              selectedSubmission?.id === submission.id
                ? "border-[#d7aa00] bg-[#fff7bf]"
                : "border-skin-stroke bg-white hover:bg-[#fffbe0]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-heading text-lg leading-tight text-skin-base">
                  {submission.title}
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {submission.traitType}
                </div>
              </div>
              {submission.status !== "approved" && (
                <StatusPill status={submission.status} />
              )}
            </div>
          </button>
        ))}
      </AdminList>

      {selectedSubmission ? (
        <NoundryEditor
          key={selectedSubmission.id}
          adminAuth={adminAuth}
          submission={selectedSubmission}
          mutate={mutate}
        />
      ) : (
        <EmptyEditor title="No gallery submissions yet" />
      )}
    </section>
  );
};

const AdminList = ({
  title,
  error,
  isLoading,
  header,
  children,
}: {
  title: string;
  error?: string;
  isLoading: boolean;
  header?: ReactNode;
  children: ReactNode;
}) => (
  <div className="h-fit rounded-2xl border border-skin-stroke bg-white p-4 shadow-sm">
    <h2 className="font-heading text-2xl leading-none text-skin-base">
      {title}
    </h2>
    {header}
    {isLoading && <p className="mt-4 text-secondary">Loading...</p>}
    {error && <p className="mt-4 text-skin-proposal-danger">{error}</p>}
    <div className="mt-4 flex max-h-[760px] flex-col gap-3 overflow-y-auto">
      {children}
    </div>
  </div>
);

const ProjectEditor = ({
  adminAuth,
  project,
  mutate,
}: {
  adminAuth: AdminAuth;
  project: CommunityProjectRecord;
  mutate: KeyedMutator<{ projects: CommunityProjectRecord[] }>;
}) => {
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description);
  const [artist, setArtist] = useState(project.artist);
  const [category, setCategory] = useState(project.category);
  const [date, setDate] = useState(project.date);
  const [href, setHref] = useState(project.href);
  const [image, setImage] = useState(project.image);
  const [details, setDetails] = useState(toLines(project.details));
  const [galleryImages, setGalleryImages] = useState(
    toLines(project.galleryImages)
  );
  const [links, setLinks] = useState(formatLinks(project.links));
  const [editorMode, setEditorMode] = useState<ProjectEditorMode>("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previewProject: CommunityProject = {
    title,
    slug,
    description,
    artist,
    category,
    date,
    href,
    image,
    details: fromLines(details),
    galleryImages: fromLines(galleryImages),
    links: parseLinks(links),
  };

  const submit = async (action?: "approve" | "remove") => {
    try {
      setIsSaving(true);
      setMessage(null);
      const projectPayload: Partial<CommunityProject> = {
        title,
        slug,
        description,
        artist,
        category,
        date,
        href,
        image,
        details: fromLines(details),
        galleryImages: fromLines(galleryImages),
        links: parseLinks(links),
      };

      await sendAdminRequest(
        `/api/admin/community-projects/${project.id}`,
        adminAuth,
        action === "remove" ? "DELETE" : "PATCH",
        action ? { action } : { project: projectPayload }
      );
      await mutate();
      setMessage(
        action === "approve"
          ? "Project approved."
          : action === "remove"
            ? "Project removed."
            : "Project saved."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to save project.";
      setMessage(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditorCard
      title={project.title}
      status={project.status}
      message={message}
      showStatusInTitle={false}
      headingAddon={
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex w-fit gap-1.5 rounded-xl border border-[#b6b6b6] bg-[#f1f1f1] p-1 shadow-[0px_4px_0px_0px_#b6b6b6]">
            {projectEditorModes.map((mode) => {
              const isActive = editorMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setEditorMode(mode.id)}
                  className={`rounded-lg px-4 py-2 font-heading text-sm transition ${
                    isActive
                      ? "translate-y-[-1px] bg-accent text-skin-base shadow-[0px_3px_0px_0px_#b89400]"
                      : "text-secondary hover:bg-[#fff7bf] hover:text-skin-base"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
          <StatusPill status={project.status} />
        </div>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => submit()}
            disabled={isSaving}
            className={primaryButtonClass}
          >
            Save changes
          </button>
          {project.status !== "approved" && (
            <button
              type="button"
              onClick={() => submit("approve")}
              disabled={isSaving}
              className={secondaryButtonClass}
            >
              Approve
            </button>
          )}
          <button
            type="button"
            onClick={() => submit("remove")}
            disabled={isSaving}
            className={dangerButtonClass}
          >
            Remove
          </button>
        </>
      }
    >
      {editorMode === "edit" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Title" value={title} onChange={setTitle} />
            <FormField label="Slug" value={slug} onChange={setSlug} />
            <FormField label="Artist" value={artist} onChange={setArtist} />
            <FormField
              label="Category"
              value={category}
              onChange={setCategory}
            />
            <FormField label="Date" value={date} onChange={setDate} />
            <FormField label="Project URL" value={href} onChange={setHref} />
          </div>
          <FormField label="Image URL" value={image} onChange={setImage} />
          <FormField
            label="Description"
            value={description}
            onChange={setDescription}
            rows={4}
          />
          <FormField
            label="Details, one per line"
            value={details}
            onChange={setDetails}
            rows={5}
          />
          <FormField
            label="Gallery images, one URL per line"
            value={galleryImages}
            onChange={setGalleryImages}
            rows={4}
          />
          <FormField
            label="Links, one per line as Title | URL"
            value={links}
            onChange={setLinks}
            rows={4}
          />
        </>
      ) : (
        <ProjectPreview project={previewProject} />
      )}
    </EditorCard>
  );
};

const ProjectPreview = ({ project }: { project: CommunityProject }) => {
  const isExternal = project.href.startsWith("http");

  return (
    <div className="rounded-2xl border border-skin-stroke bg-[#ffcc00]/20 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={project.image}
        alt={project.title}
        className="max-h-[420px] w-full rounded-2xl border border-skin-stroke bg-skin-muted object-cover shadow-sm"
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="flex flex-col gap-4 rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm">
          <div className="caption font-semibold text-secondary">
            {project.category} / {project.date}
          </div>
          <h3 className="font-heading text-[34px] leading-none text-skin-base">
            {project.title || "Untitled project"}
          </h3>
          <p className="text-lg leading-snug text-skin-base">
            {project.description || "No description entered yet."}
          </p>
          {project.details.length > 0 && (
            <div className="flex flex-col gap-3 text-base leading-snug text-secondary">
              {project.details.map((detail, index) => (
                <p key={`${detail}-${index}`}>{detail}</p>
              ))}
            </div>
          )}
          {project.galleryImages && project.galleryImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {project.galleryImages.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="overflow-hidden rounded-2xl border border-skin-stroke bg-skin-muted shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`${project.title} gallery image ${index + 1}`}
                    className="aspect-square h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-skin-stroke bg-skin-muted p-5 shadow-sm">
          <dl className="flex flex-col gap-4 text-base">
            <div>
              <dt className="font-heading text-xl">Category</dt>
              <dd className="mt-1 text-secondary">
                {project.category || "Uncategorized"}
              </dd>
            </div>
            <div>
              <dt className="font-heading text-xl">Artist</dt>
              <dd className="mt-1 text-secondary">
                {project.artist || "Unknown artist"}
              </dd>
            </div>
          </dl>

          {project.href && (
            <a
              href={project.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className="mt-6 flex w-full items-center justify-center rounded-[18px] bg-accent px-5 py-3 font-heading text-lg text-skin-base shadow-[0px_4.02px_0px_0px_#b89400] transition hover:-translate-y-0.5 hover:bg-[#ffd84d] hover:shadow-[0px_6px_0px_0px_#b89400] active:translate-y-1 active:shadow-none"
            >
              View source
            </a>
          )}

          {project.links && project.links.length > 0 && (
            <div className="mt-5 flex flex-col gap-3">
              {project.links.map((link) => {
                const isLinkExternal = link.href.startsWith("http");

                return (
                  <a
                    key={`${link.title}-${link.href}`}
                    href={link.href}
                    target={isLinkExternal ? "_blank" : undefined}
                    rel={isLinkExternal ? "noreferrer" : undefined}
                    className="font-heading text-base text-skin-base underline transition hover:opacity-70"
                  >
                    {link.title}
                  </a>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const NoundryEditor = ({
  adminAuth,
  submission,
  mutate,
}: {
  adminAuth: AdminAuth;
  submission: NoundrySubmission;
  mutate: KeyedMutator<{ submissions: NoundrySubmission[] }>;
}) => {
  const [title, setTitle] = useState(submission.title);
  const [artist, setArtist] = useState(submission.artist);
  const [traitType, setTraitType] = useState(submission.traitType);
  const [selectedTraits, setSelectedTraits] = useState(
    formatTraits(submission.selectedTraits)
  );
  const [previewTraits, setPreviewTraits] = useState(
    formatTraits(submission.previewTraits)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (action?: "approve" | "remove") => {
    try {
      setIsSaving(true);
      setMessage(null);
      const submissionPayload = {
        title,
        artist,
        traitType,
        selectedTraits: parseTraits(selectedTraits),
        previewTraits: parseTraits(previewTraits),
      };

      await sendAdminRequest(
        `/api/admin/noundry-submissions/${submission.id}`,
        adminAuth,
        action === "remove" ? "DELETE" : "PATCH",
        action
          ? { action, submission: submissionPayload }
          : { submission: submissionPayload }
      );
      await mutate();
      setMessage(
        action === "approve"
          ? "Submission approved."
          : action === "remove"
            ? "Submission removed."
            : "Submission saved."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to save submission.";
      setMessage(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditorCard
      title={submission.title}
      status={submission.status}
      message={message}
      showStatusInTitle={submission.status !== "approved"}
      actions={
        <>
          <button
            type="button"
            onClick={() => submit()}
            disabled={isSaving}
            className={primaryButtonClass}
          >
            Save metadata
          </button>
          {submission.status !== "approved" && (
            <button
              type="button"
              onClick={() => submit("approve")}
              disabled={isSaving}
              className={secondaryButtonClass}
            >
              Approve
            </button>
          )}
          <button
            type="button"
            onClick={() => submit("remove")}
            disabled={isSaving}
            className={dangerButtonClass}
          >
            Remove
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="rounded-2xl border border-skin-stroke bg-[#fff7bf] p-4">
            <PixelGridPreview pixels={submission.pixels} />
          </div>
          <p className="mt-3 text-sm leading-snug text-secondary">
            Pixel artwork is preserved as submitted. Metadata edits only change
            gallery labels and preview composition.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <FormField label="Title" value={title} onChange={setTitle} />
          <FormField
            label="Artist wallet"
            value={artist}
            onChange={setArtist}
          />
          <FormField
            label="Trait type"
            value={traitType}
            onChange={setTraitType}
          />
          <FormField
            label="Selected traits as trait: value"
            value={selectedTraits}
            onChange={setSelectedTraits}
            rows={5}
          />
          <FormField
            label="Preview traits as trait: value"
            value={previewTraits}
            onChange={setPreviewTraits}
            rows={5}
          />
        </div>
      </div>
    </EditorCard>
  );
};

const EditorCard = ({
  title,
  status,
  message,
  headingAddon,
  showStatusInTitle = true,
  actions,
  children,
}: {
  title: string;
  status: string;
  message: string | null;
  headingAddon?: ReactNode;
  showStatusInTitle?: boolean;
  actions: ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-skin-stroke bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 border-b border-skin-stroke pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-3xl leading-none text-skin-base">
            {title}
          </h2>
          {showStatusInTitle && <StatusPill status={status} />}
        </div>
        {headingAddon}
        {message && <p className="mt-2 text-sm text-secondary">{message}</p>}
      </div>
      <div className="flex shrink-0 flex-nowrap gap-3">{actions}</div>
    </div>
    <div className="mt-5 flex flex-col gap-4">{children}</div>
  </div>
);

const EmptyEditor = ({ title }: { title: string }) => (
  <div className="rounded-2xl border border-dashed border-skin-stroke bg-white p-8 text-center shadow-sm">
    <h2 className="font-heading text-3xl leading-none text-skin-base">
      {title}
    </h2>
  </div>
);

const FormField = ({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) => (
  <label className={labelClass}>
    {label}
    {rows ? (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={`${fieldClass} mt-2 resize-y`}
      />
    ) : (
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} mt-2`}
      />
    )}
  </label>
);

const PixelGridPreview = ({ pixels }: { pixels: string[] }) => (
  <div
    className="grid aspect-square w-full overflow-hidden rounded-xl bg-[#999]"
    style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}
  >
    {Array.from({ length: 32 * 32 }).map((_, index) => {
      const color = pixels[index] || "transparent";

      return (
        <div
          key={index}
          className="aspect-square"
          style={{
            backgroundColor: color === "transparent" ? "#9a9a9a" : color,
          }}
        />
      );
    })}
  </div>
);
