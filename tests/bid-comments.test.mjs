import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const loadTsModule = (filePath) => {
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };

  vm.runInNewContext(transpiled.outputText, {
    require,
    module,
    exports: module.exports,
    console,
    TextEncoder,
  });

  return module.exports;
};

const bidComments = loadTsModule(
  resolve(process.cwd(), "utils/bid-comments.ts")
);

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("normalizes bid comments by trimming whitespace", () => {
  assert.equal(
    bidComments.normalizeBidComment("  Had to collect this one.  "),
    "Had to collect this one."
  );
  assert.equal(bidComments.normalizeBidComment(123), "");
});

test("rejects empty, unsupported, and over-length comments", () => {
  assert.equal(
    bidComments.validateBidCommentText("   "),
    "Comment is required."
  );
  assert.equal(
    bidComments.validateBidCommentText("bad � character"),
    "Bid comment contains unsupported characters. Please retype your comment."
  );
  assert.equal(
    bidComments.validateBidCommentText(
      "x".repeat(bidComments.MAX_BID_COMMENT_LENGTH + 1)
    ),
    `Comment must be ${bidComments.MAX_BID_COMMENT_LENGTH} bytes or fewer.`
  );
  assert.equal(
    bidComments.validateBidCommentText("Public bid note."),
    undefined
  );
});

test("creates the same UTF-8 data suffix nouns.build appends to bids", () => {
  assert.equal(
    bidComments.getBidCommentDataSuffix("  Had to collect this one.  "),
    "0x48616420746f20636f6c6c6563742074686973206f6e652e"
  );
  assert.equal(bidComments.getBidCommentDataSuffix("   "), undefined);
});

test("truncates comments by UTF-8 byte length without splitting characters", () => {
  assert.equal(bidComments.getBidCommentByteLength("🫡"), 4);
  assert.equal(bidComments.truncateBidCommentToByteLimit("abc🫡def", 6), "abc");
  assert.equal(
    bidComments.truncateBidCommentToByteLimit("abc🫡def", 7),
    "abc🫡"
  );
});

test("appends bid comment data suffix to prepared transaction calldata", () => {
  assert.equal(
    bidComments.appendBidCommentDataSuffix("0x1234", "0xabcd"),
    "0x1234abcd"
  );
  assert.equal(
    bidComments.appendBidCommentDataSuffix("0x1234", undefined),
    "0x1234"
  );
});

test("merges comments into the matching transaction hash only", () => {
  const bids = [
    { transactionHash: "0xabc", bidAmount: "1" },
    { transactionHash: "0xdef", bidAmount: "2" },
  ];
  const merged = bidComments.mergeBidCommentsIntoBids(bids, [
    { transactionHash: "0xDEF", comment: "Second bid comment." },
  ]);

  assert.equal(merged[0].comment, undefined);
  assert.equal(merged[1].comment, "Second bid comment.");
});

let failures = 0;

for (const { name, run } of tests) {
  try {
    run();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
