import React from "react";

export type VoteSummaryItem = {
  label: string;
  type: "success" | "danger" | "muted";
  value: number;
  percentage: number;
};

export type VoteMetricItem = {
  label: string;
  eyebrow: string;
  value: React.ReactNode;
};

export default function ProposalVoteSummary({
  votes,
  metrics,
}: {
  votes: VoteSummaryItem[];
  metrics: VoteMetricItem[];
}) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {votes.map((vote) => (
          <div
            key={vote.label}
            className="w-full rounded-xl border border-skin-stroke bg-white p-6"
          >
            <ProgressBar {...vote} />
          </div>
        ))}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex w-full items-center justify-between rounded-xl border border-skin-stroke bg-white p-6 sm:items-baseline"
          >
            <div className="font-heading text-xl text-skin-muted">
              {metric.label}
            </div>
            <div className="text-right">
              <div className="text-skin-muted">{metric.eyebrow}</div>
              <div className="font-semibold">{metric.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ProgressBar = ({ label, type, value, percentage }: VoteSummaryItem) => {
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
      <div className="mb-1 flex flex-col items-center justify-between sm:flex-row sm:items-start">
        <div className={`${textColor} font-heading text-xl`}>{label}</div>
        <div className="mt-4 text-center text-xl font-semibold text-skin-base sm:mt-0 sm:text-left">
          {value}
        </div>
      </div>
      <div className={`mt-4 h-4 w-full rounded-full ${bgColor} sm:mt-0`}>
        <div
          className={`${baseColor} h-4 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
