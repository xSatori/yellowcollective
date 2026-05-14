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
    URL,
    process,
  });

  return module.exports;
};

const urlSafety = loadTsModule(resolve(process.cwd(), "utils/url-safety.ts"));

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("accepts safe HTTPS URLs and intentional internal paths", () => {
  assert.equal(
    urlSafety.normalizeSafeProjectUrl("https://example.com/path"),
    "https://example.com/path"
  );
  assert.equal(
    urlSafety.normalizeSafeProjectUrl("/projects/yellow", {
      allowInternal: true,
    }),
    "/projects/yellow"
  );
  assert.equal(urlSafety.normalizeSafeProjectUrl("/projects/yellow"), "");
});

test("rejects dangerous or obfuscated URL schemes", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "//evil.com",
    "java\u200bscript:alert(1)",
    "https ://example.com",
  ]) {
    assert.equal(urlSafety.normalizeSafeProjectUrl(value), "", value);
  }
});

test("upgrades legacy Yellow http links and limits http localhost to dev", () => {
  assert.equal(
    urlSafety.normalizeSafeProjectUrl("http://yellowcollective.art/proposals/1"),
    "https://yellowcollective.art/proposals/1"
  );
  assert.equal(
    urlSafety.normalizeSafeProjectUrl("http://localhost:3000/test", {
      allowLocalHttp: true,
    }),
    "http://localhost:3000/test"
  );
  assert.equal(urlSafety.normalizeSafeProjectUrl("http://evil.com"), "");
});

test("image helper rejects html/svg data URLs and accepts uploaded bitmaps", () => {
  assert.equal(
    urlSafety.normalizeSafeImageUrl("data:text/html,hi", {
      allowDataImages: true,
    }),
    ""
  );
  assert.equal(
    urlSafety.normalizeSafeImageUrl("data:image/svg+xml;base64,abcd", {
      allowDataImages: true,
    }),
    ""
  );
  assert.equal(
    urlSafety.normalizeSafeImageUrl("data:image/png;base64,abcd", {
      allowDataImages: true,
    }),
    "data:image/png;base64,abcd"
  );
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
