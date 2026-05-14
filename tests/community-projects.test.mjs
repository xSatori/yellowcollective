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
  });

  return module.exports;
};

const community = loadTsModule(resolve(process.cwd(), "data/community.ts"));

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("normalizes project member addresses as checksum deduped wallets", () => {
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        community.normalizeCommunityProjectMemberAddresses([
          "0x000000000000000000000000000000000000dead",
          "0x000000000000000000000000000000000000dEaD",
          "not-a-wallet",
          "",
        ])
      )
    ),
    ["0x000000000000000000000000000000000000dEaD"]
  );
});

test("accepts missing legacy member address arrays", () => {
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(community.normalizeCommunityProjectMemberAddresses())
    ),
    []
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(community.getInvalidCommunityProjectMemberAddresses())
    ),
    []
  );
});

test("reports invalid project member address input", () => {
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(community.getInvalidCommunityProjectMemberAddresses("bad"))
    ),
    ["memberAddresses"]
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        community.getInvalidCommunityProjectMemberAddresses([
          "0x000000000000000000000000000000000000dEaD",
          "bad",
        ])
      )
    ),
    ["bad"]
  );
});

for (const { name, run } of tests) {
  run();
  console.log(`ok - ${name}`);
}
