import Layout from "@/components/Layout";
import { shortenAddress } from "@/utils/shortenAddress";
import {
  getNounsDaoProposalByNumber,
  getNounsDaoProposals,
  type NounsDaoProposal,
} from "data/nouns-dao/proposals";
import { ETHERSCAN_BASEURL } from "constants/urls";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { BigNumber, ethers } from "ethers";
import type {
  GetStaticPaths,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type NounsProposalDetailProps = {
  proposal: NounsDaoProposal;
};

const formatDate = (timestamp: string) =>
  new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const getStatus = (state: number) => {
  switch (state) {
    case 0:
      return { label: "Upcoming", className: "bg-skin-proposal-highlighted" };
    case 9:
      return { label: "Upcoming", className: "bg-skin-proposal-highlighted" };
    case 10:
      return { label: "Upcoming", className: "bg-skin-proposal-highlighted" };
    case 1:
      return { label: "Active", className: "bg-skin-proposal-highlighted" };
    case 2:
      return { label: "Canceled", className: "bg-skin-proposal-muted" };
    case 3:
      return { label: "Defeated", className: "bg-skin-proposal-danger" };
    case 4:
      return { label: "Succeeded", className: "bg-skin-proposal-success" };
    case 5:
      return { label: "Queued", className: "bg-[#ffcc00] text-skin-base" };
    case 6:
      return { label: "Expired", className: "bg-skin-proposal-muted" };
    case 7:
      return { label: "Executed", className: "bg-skin-proposal-success" };
    case 8:
      return { label: "Vetoed", className: "bg-skin-proposal-danger" };
    default:
      return { label: "Unknown", className: "bg-skin-proposal-muted" };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const proposals = await getNounsDaoProposals();

    return {
      paths: proposals.map((proposal) => ({
        params: { proposalNumber: String(proposal.proposalNumber) },
      })),
      fallback: "blocking",
    };
  } catch {
    return {
      paths: [],
      fallback: "blocking",
    };
  }
};

export const getStaticProps = async ({
  params,
}: {
  params?: { proposalNumber?: string };
}): Promise<GetStaticPropsResult<NounsProposalDetailProps>> => {
  try {
    const proposalNumber = Number(params?.proposalNumber);
    const proposal = Number.isFinite(proposalNumber)
      ? await getNounsDaoProposalByNumber(proposalNumber)
      : undefined;

    if (!proposal) return { notFound: true, revalidate: 60 };

    return {
      props: { proposal },
      revalidate: 60,
    };
  } catch (error) {
    console.warn(
      `Unable to load Nouns DAO proposal detail ${params?.proposalNumber}`,
      error
    );
    return { notFound: true, revalidate: 60 };
  }
};

export default function NounsProposalDetailPage({
  proposal,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const status = getStatus(proposal.state);
  const description = getDescriptionWithoutTitle(proposal);
  const forVotes = Number(proposal.forVotes || 0);
  const againstVotes = Number(proposal.againstVotes || 0);
  const abstainVotes = Number(proposal.abstainVotes || 0);

  const getVotePercentage = (votes: number) => {
    const total = forVotes + againstVotes + abstainVotes;
    if (!votes || !total) return 0;

    const value = Math.round((votes / total) * 100);
    if (value > 100) return 100;
    return value;
  };

  return (
    <Layout>
      <Head>
        <title>
          Nouns Proposal {proposal.proposalNumber} | Yellow Collective
        </title>
      </Head>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 pb-12">
        <div className="flex flex-col sm:flex-row items-baseline justify-between">
          <div className="flex items-baseline">
            <Link
              href="/proposals/nouns"
              className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border border-skin-stroke bg-white transition hover:bg-[#fff7bf]"
              aria-label="Back to Nouns DAO proposals"
            >
              <ArrowLeftIcon className="h-5 text-skin-base" />
            </Link>

            <div>
              <div className="flex items-center">
                <div className="font-heading text-2xl text-skin-base mr-4 break-words">
                  Nouns DAO Proposals
                </div>
                <div
                  className={`${status.className} w-24 rounded-md p-1 px-2 text-center ${status.className.includes("text-") ? "" : "text-white"}`}
                >
                  {status.label}
                </div>
              </div>
              <h1 className="mt-2 text-5xl font-heading text-skin-base font-semibold">
                {proposal.title}
              </h1>
              <div className="mt-4 text-2xl font-heading text-skin-muted">
                Proposed by{" "}
                <Link
                  href={`${ETHERSCAN_BASEURL}/address/${proposal.proposer}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-skin-highlighted underline"
                >
                  {shortenAddress(proposal.proposer)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="items-center w-full grid grid-cols-3 gap-4 mt-6">
          <div className="w-full bg-white border border-skin-stroke rounded-xl p-6">
            <ProgressBar
              label="For"
              type="success"
              value={forVotes}
              percentage={getVotePercentage(forVotes)}
            />
          </div>
          <div className="w-full bg-white border border-skin-stroke rounded-xl p-6">
            <ProgressBar
              label="Against"
              type="danger"
              value={againstVotes}
              percentage={getVotePercentage(againstVotes)}
            />
          </div>
          <div className="w-full bg-white border border-skin-stroke rounded-xl p-6">
            <ProgressBar
              label="Abstain"
              type="muted"
              value={abstainVotes}
              percentage={getVotePercentage(abstainVotes)}
            />
          </div>
        </div>

        <div className="items-center w-full grid sm:grid-cols-3 gap-4">
          <div className="w-full bg-white border border-skin-stroke rounded-xl p-6 flex justify-between items-center sm:items-baseline">
            <div className="font-heading text-xl text-skin-muted">
              Threshold
            </div>
            <div className="text-right">
              <div className="text-skin-muted">Current Threshold</div>
              <div className="font-semibold">
                {proposal.quorumVotes || 1} Quorum
              </div>
            </div>
          </div>

          <div className="w-full bg-white border border-skin-stroke rounded-xl p-6 flex justify-between items-center sm:items-baseline">
            <div className="font-heading text-xl text-skin-muted">Ends</div>
            <div className="text-right">
              <div className="text-skin-muted">Block</div>
              <div className="font-semibold">{proposal.voteEndBlock}</div>
            </div>
          </div>

          <div className="w-full bg-white border border-skin-stroke rounded-xl p-6 flex justify-between items-center sm:items-baseline">
            <div className="font-heading text-xl text-skin-muted">Snapshot</div>
            <div className="text-right">
              <div className="text-skin-muted">Block</div>
              <div className="font-semibold">{proposal.voteStartBlock}</div>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8">
          <div className="text-2xl font-heading text-skin-base font-bold">
            Description
          </div>

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-skin mt-4 max-w-none break-words prose-headings:font-heading prose-p:text-base prose-p:leading-snug prose-a:text-accent-blue prose-a:underline md:prose-p:text-lg"
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {description}
          </ReactMarkdown>
        </section>

        <section className="mt-2 rounded-2xl border border-skin-stroke bg-white p-6 shadow-sm md:p-8">
          <div className="text-2xl font-heading text-skin-base font-bold">
            Proposed Transactions
          </div>
          {proposal.targets.map((target, index) => (
            <ProposedTransaction
              key={`${target}-${index}`}
              target={target}
              value={proposal.values[index]}
              signature={proposal.signatures[index]}
              calldata={proposal.calldatas[index]}
            />
          ))}
        </section>
      </div>
    </Layout>
  );
}

const ProposedTransaction = ({
  target,
  value,
  signature,
  calldata,
}: {
  target: string;
  value: string;
  signature?: string;
  calldata?: string;
}) => {
  const valueBN = BigNumber.from(value || 0);

  return (
    <div className="mt-4 w-full rounded-xl border border-skin-stroke bg-white p-4">
      <div className="break-words">
        <Link
          href={`${ETHERSCAN_BASEURL}/address/${target}`}
          rel="noopener noreferrer"
          target="_blank"
          className="text-skin-highlighted underline"
        >
          {target}
        </Link>
        <span>{`.${signature || "transfer"}(`}</span>
      </div>
      {!valueBN.isZero() && (
        <div className="ml-4">{`${ethers.utils.formatEther(valueBN)} ETH`}</div>
      )}
      {calldata && calldata !== "0x" && (
        <div className="ml-4 break-words">{calldata}</div>
      )}
      <div>{")"}</div>
    </div>
  );
};

const normalizeHeading = (value: string) =>
  value
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .trim()
    .toLowerCase();

const getDescriptionWithoutTitle = (proposal: NounsDaoProposal) => {
  const lines = proposal.description.split("\n");
  let firstContentIndex = lines.findIndex((line) => line.trim());

  if (firstContentIndex === -1) return proposal.description;

  while (
    firstContentIndex !== -1 &&
    normalizeHeading(lines[firstContentIndex].trim()) ===
      normalizeHeading(proposal.title)
  ) {
    lines.splice(firstContentIndex, 1);
    firstContentIndex = lines.findIndex((line) => line.trim());
  }

  return lines.join("\n").trim();
};

const ProgressBar = ({
  label,
  type,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
  type: "success" | "danger" | "muted";
}) => {
  let textColor;
  let baseColor;
  let bgColor;

  switch (type) {
    case "success":
      textColor = "text-skin-proposal-success";
      baseColor = "bg-skin-proposal-success";
      bgColor = "bg-skin-proposal-success bg-opacity-10";
      break;
    case "danger":
      textColor = "text-skin-proposal-danger";
      baseColor = "bg-skin-proposal-danger";
      bgColor = "bg-skin-proposal-danger bg-opacity-10";
      break;
    case "muted":
      textColor = "text-skin-proposal-muted";
      baseColor = "bg-skin-proposal-muted";
      bgColor = "bg-skin-proposal-muted bg-opacity-10";
      break;
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center sm:items-start sm:flex-row justify-between mb-1">
        <div className={`${textColor} font-heading text-xl`}>{label}</div>
        <div className="font-semibold text-xl mt-4 sm:mt-0 text-center sm:text-left">
          {value}
        </div>
      </div>
      <div className={`w-full ${bgColor} rounded-full h-4 mt-4 sm:mt-0`}>
        <div
          className={`${baseColor} h-4 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
