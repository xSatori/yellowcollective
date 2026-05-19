import { Proposal } from "@/services/nouns-builder/governor";
import { Fragment } from "react";

const baseClassName =
  "rounded-md p-1 px-2 text-center text-sm font-heading md:text-base";

export default function ProposalStatus({
  proposal,
  className = "w-24",
}: {
  proposal: Proposal;
  className?: string;
}) {
  const { state } = proposal;
  const statusClassName = `${baseClassName} ${className}`;

  switch (state) {
    case 0:
      return (
        <div className={`${statusClassName} bg-skin-proposal-highlighted text-white`}>
          Pending
        </div>
      );
    case 1:
      return (
        <div className={`${statusClassName} bg-skin-proposal-highlighted text-white`}>
          Active
        </div>
      );
    case 2:
      return (
        <div className={`${statusClassName} bg-skin-proposal-muted text-white`}>
          Canceled
        </div>
      );
    case 3:
      return (
        <div className={`${statusClassName} bg-skin-proposal-danger text-white`}>
          Defeated
        </div>
      );
    case 4:
      return (
        <div className={`${statusClassName} bg-skin-proposal-success text-white`}>
          Succeeded
        </div>
      );
    case 5:
      return (
        <div className={`${statusClassName} bg-[#ffcc00] text-[#212529]`}>
          Queued
        </div>
      );
    case 6:
      return (
        <div className={`${statusClassName} bg-skin-proposal-muted text-white`}>
          Expired
        </div>
      );
    case 7:
      return (
        <div className={`${statusClassName} bg-skin-proposal-success text-white`}>
          Executed
        </div>
      );
    case 8:
      return (
        <div className={`${statusClassName} bg-skin-proposal-danger text-white`}>
          Vetoed
        </div>
      );
    default:
      return <Fragment />;
  }
}
