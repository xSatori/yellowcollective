import React from "react";

export type VoteSummaryItem = {
  label: string;
  type: "success" | "danger" | "muted";
  value: number;
  percentage: number;
};

export type VoteMetricItem = {
  label: string;
  eyebrow?: string;
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
    <div className="mt-5 flex flex-col gap-4 md:mt-8">
      <div className="grid w-full grid-cols-3 gap-2 md:gap-4">
        {votes.map((vote) => (
          <div
            key={vote.label}
            className="yc-dark-surface w-full rounded-xl border border-skin-stroke bg-white p-3 shadow-sm md:p-6"
          >
            <ProgressBar {...vote} />
          </div>
        ))}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="yc-dark-surface flex w-full items-center justify-between rounded-xl border border-skin-stroke bg-white p-4 shadow-sm sm:items-baseline md:p-6"
          >
            <div className="font-heading text-lg text-skin-muted md:text-xl">
              {metric.label}
            </div>
            <div className="text-right">
              {metric.eyebrow && (
                <div className="text-skin-muted">{metric.eyebrow}</div>
              )}
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
      <div className="mb-2 flex flex-col items-start justify-between gap-1">
        <div className={`${textColor} font-heading text-base leading-none md:text-xl`}>
          {label}
        </div>
        <div className="text-left text-lg font-semibold leading-none text-skin-base md:text-xl">
          {value}
        </div>
      </div>
      <div className={`h-2.5 w-full rounded-full md:h-4 ${bgColor}`}>
        <div
          className={`${baseColor} h-2.5 rounded-full md:h-4`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
