import { stringToHex } from "viem";

export const MAX_BID_COMMENT_LENGTH = 140;

export type BidCommentInput = {
  comment?: unknown;
};

export type BidCommentRecord = {
  transactionHash: string;
  comment: string;
  auctionAddress?: string;
  tokenId?: string;
  bidderAddress?: string;
  bidAmount?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const normalizeBidComment = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getBidCommentByteLength = (value: unknown) =>
  new TextEncoder().encode(normalizeBidComment(value)).length;

export const truncateBidCommentToByteLimit = (
  value: string,
  maxBytes = MAX_BID_COMMENT_LENGTH
) => {
  const encoder = new TextEncoder();
  let byteLength = 0;
  let truncated = "";

  for (const character of value) {
    const characterLength = encoder.encode(character).length;

    if (byteLength + characterLength > maxBytes) break;

    byteLength += characterLength;
    truncated += character;
  }

  return truncated;
};

export const validateBidCommentText = (value: unknown) => {
  const comment = normalizeBidComment(value);

  if (!comment) return "Comment is required.";
  if (comment.includes("�")) {
    return "Bid comment contains unsupported characters. Please retype your comment.";
  }
  if (getBidCommentByteLength(comment) > MAX_BID_COMMENT_LENGTH) {
    return `Comment must be ${MAX_BID_COMMENT_LENGTH} bytes or fewer.`;
  }

  return undefined;
};

export const getBidCommentDataSuffix = (value: unknown) => {
  const comment = normalizeBidComment(value);

  if (!comment || validateBidCommentText(comment)) return undefined;

  return stringToHex(comment);
};

export const appendBidCommentDataSuffix = (
  data: string | undefined,
  dataSuffix: string | undefined
) =>
  data && dataSuffix
    ? `${data}${dataSuffix.replace(/^0x/, "")}`
    : data;

export const getBidCommentByTransactionHash = (
  comments: BidCommentRecord[]
) => {
  const commentsByHash = new Map<string, BidCommentRecord>();

  comments.forEach((comment) => {
    if (comment.transactionHash) {
      commentsByHash.set(comment.transactionHash.toLowerCase(), comment);
    }
  });

  return commentsByHash;
};

export const mergeBidCommentsIntoBids = <
  T extends { transactionHash?: string; comment?: string },
>(
  bids: T[],
  comments: BidCommentRecord[]
) => {
  const commentsByHash = getBidCommentByTransactionHash(comments);

  return bids.map((bid) => {
    const comment = bid.transactionHash
      ? commentsByHash.get(bid.transactionHash.toLowerCase())?.comment
      : undefined;

    return comment ? { ...bid, comment } : bid;
  });
};
